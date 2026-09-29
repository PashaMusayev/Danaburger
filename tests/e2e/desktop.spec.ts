import { expect, test } from '@playwright/test';
import { expectValues, login, resetRepo } from './helpers';

test.beforeEach(async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop-only features');
  await resetRepo(request);
});

test('Excel-style price entry: Enter moves down, ↑ moves up', async ({ page }) => {
  await login(page);
  await page.selectOption('select[aria-label="Kateqoriya filtri"]', 'lahmacun');
  const prices = page.locator('table input[data-col="price"]');
  await expect(prices).toHaveCount(3);
  await prices.nth(0).click();
  await page.keyboard.type('3.70');
  await page.keyboard.press('Enter');
  await page.keyboard.type('3,90');
  await page.keyboard.press('Enter');
  await page.keyboard.type('4.70');
  await page.keyboard.press('ArrowUp');
  await expect(prices.nth(1)).toBeFocused();
  await expectValues(prices, ['3.70', '3.90', '4.70']);
  await expect(page.getByText('3 dəyişiklik')).toBeVisible();
});

test('bulk +10% previews the right numbers before applying', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: '± Toplu qiymət' }).click();
  const dialog = page.getByRole('dialog', { name: 'Toplu qiymət dəyişikliyi' });
  await dialog.locator('select').selectOption('lahmacun');
  await dialog.getByRole('button', { name: '%' }).click();
  await dialog.getByLabel('Dəyişiklik miqdarı').fill('10');
  const preview = dialog.getByTestId('bulk-preview');
  // 3.60 → 3.96, 3.80 → 4.18, 4.60 → 5.06
  await expect(preview.locator('tr')).toHaveCount(3);
  const rows = await preview.locator('tr').allInnerTexts();
  expect(rows.map((r) => r.replace(/\s+/g, ' ').trim())).toEqual(['Sadə 3.60 → 3.96', 'Pendirli 3.80 → 4.18', 'Qarışıq 4.60 → 5.06']);
  await dialog.getByLabel(/0.10-a yuvarlaqlaşdır/).check();
  expect((await preview.locator('tr').allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').trim())).toEqual([
    'Sadə 3.60 → 4.00',
    'Pendirli 3.80 → 4.20',
    'Qarışıq 4.60 → 5.10',
  ]);
  await dialog.getByRole('button', { name: '3 qiyməti dəyiş' }).click();
  await page.selectOption('select[aria-label="Kateqoriya filtri"]', 'lahmacun');
  await expectValues(page.locator('table input[data-col="price"]'), ['4.00', '4.20', '5.10']);
});

test('bulk price refuses changes that break a discount', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: '± Toplu qiymət' }).click();
  const dialog = page.getByRole('dialog', { name: 'Toplu qiymət dəyişikliyi' });
  await dialog.locator('select').selectOption('combos');
  await dialog.getByLabel('Dəyişiklik miqdarı').fill('1');
  await expect(dialog).toContainText('Köhnə qiymətdən');
  await expect(dialog.getByRole('button', { name: /qiyməti dəyiş/ })).toBeDisabled();
});

test('bulk select: mark several items bitib at once', async ({ page }) => {
  await login(page);
  await page.fill('input[type="search"]', 'limonad');
  for (const id of ['limonad-ciyelek', 'limonad-saftali']) await page.getByTestId(`row-${id}`).getByRole('checkbox').check();
  await page.getByRole('region', { name: 'Toplu əməliyyatlar' }).getByRole('button', { name: 'Bitib et' }).click();
  await expect(page.getByText('2 dəyişiklik')).toBeVisible();
});

test('keyboard shortcuts: / focuses search, N opens a new item, Esc closes it', async ({ page }) => {
  await login(page);
  await page.keyboard.press('/');
  await expect(page.locator('input[type="search"]')).toBeFocused();
  await page.locator('h1').click();
  await page.keyboard.press('n');
  await expect(page.getByRole('dialog', { name: 'Yeni məhsul' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Yeni məhsul' })).toBeHidden();
});
