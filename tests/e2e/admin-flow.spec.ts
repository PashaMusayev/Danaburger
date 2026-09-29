import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { dataShas, itemLine, login, repoCommits, repoFile, resetRepo, selectBranch } from './helpers';

const ORIGINAL = Object.fromEntries(['data/menu.json', 'data/branches/gunesli.json', 'data/branches/narimanov.json', 'data/branches/4-mkr.json'].map((p) => [p, readFileSync(p, 'utf8')]));

test.beforeEach(async ({ request }) => {
  await resetRepo(request);
});

const rowOf = (page: Page, mobile: boolean) => (id: string) => page.getByTestId(`${mobile ? 'card' : 'row'}-${id}`);
const publish = async (page: Page) => {
  await page.getByTestId('publish').click();
  await expect(page.getByText('Yayımlandı ✓')).toBeVisible({ timeout: 20_000 });
};

// Runs on both projects: desktop (1440px table) and mobile (375px cards).
test('pick a branch → change price + bitib → publish → only that branch’s file changes → revert', async ({ page, request }, info) => {
  const row = rowOf(page, info.project.name === 'mobile');
  const before = await dataShas(request);
  await login(page);
  await selectBranch(page, 'Nərimanov');

  const price = row('ciz-burger').locator('input[data-col="price"]');
  await price.fill('6,20');
  await price.press('Enter');
  await expect(price).toHaveValue('6.20');
  await row('kola-05').getByRole('switch').click();
  await expect(page.getByText('2 dəyişiklik')).toBeVisible();

  // switching branch shows that branch's own, untouched prices
  await selectBranch(page, 'Günəşli');
  await expect(row('ciz-burger').locator('input[data-col="price"]')).toHaveValue('5.80');
  await selectBranch(page, '4-cü mikrorayon');
  await expect(row('ciz-burger').locator('input[data-col="price"]')).toHaveValue('5.20');

  await publish(page);
  const [commit] = await repoCommits(request);
  expect(commit.message.split('\n')[0]).toBe('Admin: Nərimanov: Çizburger 5.80→6.20; Nərimanov: Kola 0.5 bitib');
  const after = await dataShas(request);
  const changed = Object.keys(after).filter((p) => after[p] !== before[p]);
  expect(changed).toEqual(['data/branches/narimanov.json']);
  const nar = (await repoFile(request, 'data/branches/narimanov.json')).text;
  expect(itemLine(nar, 'ciz-burger')).toBe('    {"id": "ciz-burger", "price": 6.2, "available": true},');
  expect(itemLine(nar, 'kola-05')).toContain('"available": false');
  // only the two edited lines differ: clean git diff
  const orig = new Set(ORIGINAL['data/branches/narimanov.json'].split('\n'));
  expect(nar.split('\n').filter((l) => !orig.has(l))).toHaveLength(2);

  // history → revert
  await page.getByRole('link', { name: /Tarixçə/ }).filter({ visible: true }).click();
  const entries = page.getByTestId('history-entry');
  await expect(entries).toHaveCount(2);
  await entries.nth(1).getByRole('button', { name: /Bu versiyaya qayıt/ }).click();
  await page.getByRole('button', { name: 'Bəli, qaytar' }).click();
  await expect(page.getByText(/geri qaytarıldı/).first()).toBeVisible({ timeout: 20_000 });
  expect((await repoFile(request, 'data/branches/narimanov.json')).text).toBe(ORIGINAL['data/branches/narimanov.json']);
  await expect(entries).toHaveCount(3);
});

test('new product at two branches with different prices, with a photo', async ({ page, request }, info) => {
  const row = rowOf(page, info.project.name === 'mobile');
  await login(page);
  await selectBranch(page, 'Nərimanov');
  await page.getByRole('button', { name: /Yeni məhsul/ }).filter({ visible: true }).click();
  await page.fill('#f-az', 'Kartof dilimləri');
  await page.selectOption('#f-cat', 'fastfood');
  await page.fill('#f-desc', 'Kəndsayağı kartof dilimləri');
  // the branch being viewed is preselected
  await expect(page.getByTestId('branch-form-narimanov').getByRole('switch', { name: /bu filialda satılır/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('branch-form-gunesli').getByRole('switch', { name: /bu filialda satılır/ })).toHaveAttribute('aria-checked', 'false');
  await page.fill('#f-narimanov-price', '4.50');
  await page.getByTestId('branch-form-4-mkr').getByRole('switch', { name: /bu filialda satılır/ }).click();
  await page.fill('#f-4-mkr-price', '4,20');
  await page.getByTestId('photo-input').setInputFiles('public/img/big-menyu.webp');
  await expect(page.getByLabel('Önizləmə').locator('img')).toBeVisible();
  await expect(page.getByLabel('Önizləmə')).toContainText('4.50 ₼');
  await page.getByTestId('save-item').click();
  await expect(row('kartof-dilimleri')).toBeVisible();
  await expect(page.getByText('3 dəyişiklik')).toBeVisible();

  await publish(page);
  const [commit] = await repoCommits(request);
  expect(commit.message.split('\n')[0]).toBe(
    'Admin: yeni: Kartof dilimləri; Nərimanov: əlavə olundu: Kartof dilimləri 4.50; 4-cü mikrorayon: əlavə olundu: Kartof dilimləri 4.20',
  );
  expect(commit.files.some((f) => /^public\/img\/u\/kartof-dilimleri-[a-z0-9]+\.(webp|jpg)$/.test(f))).toBe(true);
  expect(itemLine((await repoFile(request, 'data/menu.json')).text, 'kartof-dilimleri')).toMatch(/"category": "fastfood".*"image": "\/img\/u\/kartof-dilimleri-/);
  expect(itemLine((await repoFile(request, 'data/branches/narimanov.json')).text, 'kartof-dilimleri')).toContain('"price": 4.5,');
  expect(itemLine((await repoFile(request, 'data/branches/4-mkr.json')).text, 'kartof-dilimleri')).toContain('"price": 4.2,');
  expect(itemLine((await repoFile(request, 'data/branches/gunesli.json')).text, 'kartof-dilimleri')).toBe('');
});

test('unpublished edits survive a page reload, branch included', async ({ page }, info) => {
  const row = rowOf(page, info.project.name === 'mobile');
  await login(page);
  await selectBranch(page, '4-cü mikrorayon');
  const price = row('ayran').locator('input[data-col="price"]');
  await price.fill('1.30');
  await price.press('Enter');
  await expect(page.getByText('1 dəyişiklik')).toBeVisible();
  await page.waitForTimeout(500); // draft is saved with a short debounce
  await page.reload();
  await expect(page.getByText('1 dəyişiklik')).toBeVisible();
  await expect(page.getByRole('tab', { name: /4-cü mikrorayon/ })).toHaveAttribute('aria-selected', 'true');
  await expect(price).toHaveValue('1.30');
});

test('publishing over someone else’s change is refused, never overwritten', async ({ page, request }, info) => {
  const row = rowOf(page, info.project.name === 'mobile');
  await login(page);
  const price = row('ayran').locator('input[data-col="price"]');
  await price.fill('1.60');
  await price.press('Enter');
  await request.post('http://localhost:4020/__mock/external-change');
  const externalHead = (await repoCommits(request))[0].sha;
  await page.getByTestId('publish').click();
  await expect(page.getByRole('dialog', { name: 'Menyu başqa yerdən dəyişdirilib' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Günəşli: Ayran 1.40→1.60');
  expect((await repoCommits(request))[0].sha).toBe(externalHead); // nothing was written
  await page.getByRole('button', { name: 'Menyunu yenilə' }).click();
  await expect(price).toHaveValue('1.40');
});

test('suspicious price jumps ask for confirmation', async ({ page }, info) => {
  const row = rowOf(page, info.project.name === 'mobile');
  await login(page);
  const price = row('ciz-burger').locator('input[data-col="price"]');
  await price.fill('58');
  await price.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Qiymət çox dəyişir' });
  await expect(dialog).toContainText('5.80 → 58.00');
  await dialog.getByRole('button', { name: 'İmtina' }).click();
  await expect(dialog).toBeHidden();
  await expect(price).toHaveValue('5.80');
  await expect(page.getByText(/dəyişiklik$/)).toHaveCount(0);
});

test('delete everywhere warns about combos and cleans them', async ({ page, request }, info) => {
  const row = rowOf(page, info.project.name === 'mobile');
  await login(page);
  await row('ciz-burger').getByRole('button', { name: /redaktə et/ }).first().click();
  await page.getByRole('button', { name: '🗑 Hər yerdən sil' }).click();
  const dialog = page.getByRole('dialog', { name: 'Çizburger silinsin?' });
  await expect(dialog).toContainText('Burgerçi Menyu (ət)');
  await expect(dialog).toContainText('Günəşli, Nərimanov, 4-cü mikrorayon');
  await dialog.getByRole('button', { name: 'Hər yerdən sil' }).click();
  await publish(page);
  for (const p of ['data/menu.json', 'data/branches/gunesli.json', 'data/branches/narimanov.json', 'data/branches/4-mkr.json']) {
    expect((await repoFile(request, p)).text).not.toContain('"ciz-burger"');
  }
});

test('branch settings: phone format and map coordinates', async ({ page, request }) => {
  await login(page);
  await page.getByRole('link', { name: /Ayarlar/ }).filter({ visible: true }).click();
  const card = page.getByTestId('branch-settings-narimanov');
  await card.getByLabel('Telefon').fill('055 541 48 49');
  await card.getByLabel('Telefon').blur();
  await expect(card.getByLabel('Telefon')).toHaveValue('+994555414849');
  await card.getByLabel('Xəritə koordinatı').fill('https://www.google.com/maps/@40.4093,49.8671,15z');
  await card.getByLabel('Xəritə koordinatı').blur();
  await expect(card.getByLabel('Xəritə koordinatı')).toHaveValue('40.4093, 49.8671');
  await expect(card.getByText('https://danaburger-ten.vercel.app/narimanov/menu/')).toBeVisible();
  await publish(page);
  const b = JSON.parse((await repoFile(request, 'data/branches.json')).text).branches.find((x: { id: string }) => x.id === 'narimanov');
  expect(b.phone).toBe('+994555414849');
  expect(b.geo).toEqual({ lat: 40.4093, lng: 49.8671 });
});
