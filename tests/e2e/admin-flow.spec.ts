import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { itemLine, login, repoCommits, repoFile, resetRepo } from './helpers';

const ORIGINAL = readFileSync('data/menu.json', 'utf8');

test.beforeEach(async ({ request }) => {
  await resetRepo(request);
});

// Runs on both projects: desktop (1440px table) and mobile (375px cards).
test('price → bitib → new product with photo → publish → revert', async ({ page, request }, info) => {
  const mobile = info.project.name === 'mobile';
  const row = (id: string) => page.getByTestId(`${mobile ? 'card' : 'row'}-${id}`);
  await login(page);

  // 1. change a price inline, typing a comma like the owner would
  const price = row('ciz-burger').locator('input[data-col="price"]');
  await price.fill('6,20');
  await price.press('Enter');
  await expect(price).toHaveValue('6.20');

  // 2. mark an item "bitib"
  await row('kola-05').getByRole('switch').click();
  await expect(row('kola-05').getByRole('switch')).toHaveAttribute('aria-checked', 'false');

  // 3. add a product with a photo
  await page.getByRole('button', { name: /Yeni məhsul/ }).filter({ visible: true }).click();
  await page.fill('#f-az', 'Kartof dilimləri');
  await page.selectOption('#f-cat', 'fastfood');
  await page.fill('#f-desc', 'Kəndsayağı kartof dilimləri');
  await page.fill('#f-price', '4.50');
  await page.getByTestId('photo-input').setInputFiles('public/img/big-menyu.webp');
  await expect(page.getByLabel('Önizləmə').locator('img')).toBeVisible();
  await expect(page.getByLabel('Önizləmə')).toContainText('4.50 ₼');
  await page.getByTestId('save-item').click();
  await expect(row('kartof-dilimleri')).toBeVisible();

  // 4. the bar lists exactly these changes; publish
  await expect(page.getByText('3 dəyişiklik')).toBeVisible();
  await page.getByTestId('publish').click();
  await expect(page.getByText('Yayımlandı ✓')).toBeVisible({ timeout: 20_000 });

  // one commit with menu + photo, readable message, one-item-per-line format kept
  const [commit] = await repoCommits(request);
  expect(commit.message.split('\n')[0]).toBe('Admin: Çizburger 5.80→6.20; yeni: Kartof dilimləri; Kola 0.5 bitib');
  expect(commit.files.some((f) => /^public\/img\/u\/kartof-dilimleri-[a-z0-9]+\.(webp|jpg)$/.test(f))).toBe(true);
  const menu = await repoFile(request, 'data/menu.json');
  expect(itemLine(menu.text, 'ciz-burger')).toContain('"price": 6.2,');
  expect(itemLine(menu.text, 'kola-05')).toContain('"available": false');
  expect(itemLine(menu.text, 'kartof-dilimleri')).toMatch(/"category": "fastfood".*"price": 4.5,.*"image": "\/img\/u\/kartof-dilimleri-/);
  // unchanged items are byte-identical, so git diff shows only real edits
  const before = new Set(ORIGINAL.split('\n'));
  const touched = menu.text.split('\n').filter((l) => !before.has(l));
  expect(touched).toHaveLength(3);

  // 5. history → revert to the original
  await page.getByRole('link', { name: /Tarixçə/ }).filter({ visible: true }).click();
  const entries = page.getByTestId('history-entry');
  await expect(entries).toHaveCount(2);
  await expect(entries.first()).toContainText('indiki versiya');
  await entries.nth(1).getByRole('button', { name: /Bu versiyaya qayıt/ }).click();
  await page.getByRole('button', { name: 'Bəli, qaytar' }).click();
  await expect(page.getByText(/geri qaytarıldı/).first()).toBeVisible({ timeout: 20_000 });
  expect((await repoFile(request, 'data/menu.json')).text).toBe(ORIGINAL);
  await expect(entries).toHaveCount(3);
});

test('unpublished edits survive a page reload', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await login(page);
  const price = page.getByTestId(`${mobile ? 'card' : 'row'}-ayran`).locator('input[data-col="price"]');
  await price.fill('1.50');
  await price.press('Enter');
  await expect(page.getByText('1 dəyişiklik')).toBeVisible();
  await page.waitForTimeout(500); // draft is saved with a short debounce
  await page.reload();
  await expect(page.getByText('1 dəyişiklik')).toBeVisible();
  await expect(price).toHaveValue('1.50');
});

test('publishing over someone else’s change is refused, never overwritten', async ({ page, request }, info) => {
  const mobile = info.project.name === 'mobile';
  await login(page);
  const price = page.getByTestId(`${mobile ? 'card' : 'row'}-ayran`).locator('input[data-col="price"]');
  await price.fill('1.60');
  await price.press('Enter');
  await request.post('http://localhost:4020/__mock/external-change');
  const externalHead = (await repoCommits(request))[0].sha;
  await page.getByTestId('publish').click();
  await expect(page.getByRole('dialog', { name: 'Menyu başqa yerdən dəyişdirilib' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Ayran 1.40→1.60');
  expect((await repoCommits(request))[0].sha).toBe(externalHead); // nothing was written
  await page.getByRole('button', { name: 'Menyunu yenilə' }).click();
  await expect(price).toHaveValue('1.40');
});

test('suspicious price jumps ask for confirmation', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await login(page);
  const price = page.getByTestId(`${mobile ? 'card' : 'row'}-ciz-burger`).locator('input[data-col="price"]');
  await price.fill('58');
  await price.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Qiymət çox dəyişir' });
  await expect(dialog).toContainText('5.80 → 58.00');
  await dialog.getByRole('button', { name: 'İmtina' }).click();
  await expect(dialog).toBeHidden();
  await expect(price).toHaveValue('5.80');
  await expect(page.getByText(/dəyişiklik$/)).toHaveCount(0);
});

test('deleting an item used in a combo warns and cleans the combo', async ({ page, request }, info) => {
  const mobile = info.project.name === 'mobile';
  await login(page);
  await page.getByTestId(`${mobile ? 'card' : 'row'}-ciz-burger`).getByRole('button', { name: /redaktə et/ }).first().click();
  await page.getByRole('button', { name: '🗑 Sil' }).click();
  const dialog = page.getByRole('dialog', { name: 'Çizburger silinsin?' });
  await expect(dialog).toContainText('Burgerçi Menyu (ət)');
  await dialog.getByRole('button', { name: 'Sil', exact: true }).click();
  await page.getByTestId('publish').click();
  await expect(page.getByText('Yayımlandı ✓')).toBeVisible({ timeout: 20_000 });
  const menu = await repoFile(request, 'data/menu.json');
  expect(itemLine(menu.text, 'ciz-burger')).toBe('');
  expect(menu.text).not.toContain('"ciz-burger"');
});
