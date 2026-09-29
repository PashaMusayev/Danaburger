import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('public pages are still prerendered (static)', async ({}, info) => {
  test.skip(info.project.name !== 'desktop');
  const manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'));
  const routes = Object.keys(manifest.routes);
  for (const r of ['/', '/gunesli', '/narimanov', '/4-mkr', '/gunesli/menu', '/narimanov/menu', '/4-mkr/menu', '/version.json']) expect(routes).toContain(r);
  for (const f of ['index.html', 'gunesli.html', 'narimanov/menu.html', '4-mkr.html']) expect(existsSync(`.next/server/app/${f}`)).toBe(true);
});

test('old QR codes: /menu → /gunesli/menu (308)', async ({ request }) => {
  const res = await request.get('/menu/', { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toMatch(/\/gunesli\/menu\/$/);
  expect((await request.get('/nowhere/', { maxRedirects: 0 })).status()).toBe(404);
});

test('home → pick a branch → cart → WhatsApp goes to that branch’s number', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    (window as unknown as { __wa: string[] }).__wa = [];
    window.open = ((u: string) => ((window as unknown as { __wa: string[] }).__wa.push(u), null)) as typeof window.open;
  });
  await page.goto('/');
  for (const b of ['gunesli', 'narimanov', '4-mkr']) await expect(page.getByTestId(`branch-${b}`)).toBeInViewport();
  expect(await page.content()).not.toContain('/api/admin');
  await page.getByTestId('branch-narimanov').getByRole('link', { name: /Menyuya bax/ }).click();
  await expect(page).toHaveURL(/\/narimanov\/$/);
  await expect(page).toHaveTitle(/Dana Burger Nərimanov/);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect([ld['@type'], ld.telephone, ld.name]).toEqual(['Restaurant', '+994555414848', 'Dana Burger Nərimanov']);

  await page.getByRole('button', { name: 'Əlavə et: Toyuq langet', exact: true }).click();
  await page.getByTestId('cart-button').filter({ visible: true }).click();
  await page.getByRole('button', { name: /WhatsApp-la göndər/ }).click();
  const [url] = await page.evaluate(() => (window as unknown as { __wa: string[] }).__wa);
  expect(url.split('?')[0]).toBe('https://wa.me/994555414848');
  const msg = decodeURIComponent(url.split('text=')[1]);
  expect(msg.split('\n')[0]).toBe('Salam! Nərimanov filialına sifariş:');
  expect(msg).toContain('1× Toyuq langet — 8.50 ₼');
  expect(errors).toEqual([]);
});

test('switching branch with a full cart: warns, moves what exists there, lists the rest', async ({ page }) => {
  await page.goto('/narimanov/');
  await page.getByRole('button', { name: 'Əlavə et: Çizburger', exact: true }).click();
  await page.getByRole('button', { name: 'Əlavə et: Latte', exact: true }).click();
  await page.getByRole('button', { name: /Filial: Nərimanov/ }).click();
  await page.getByRole('option', { name: /4-cü mikrorayon/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Səbətdə 2 məhsul var' });
  await expect(dialog).toContainText('4-cü mikrorayon filialında qiymətlər fərqlidir');
  await expect(dialog.getByTestId('move-missing')).toContainText('1× Latte');
  await dialog.getByRole('button', { name: 'Səbəti köçür' }).click();
  await expect(page).toHaveURL(/\/4-mkr\/$/);
  // Çizburger moved, at this branch's price
  await expect(page.getByTestId('cart-button').filter({ visible: true })).toContainText('5.20');
  // the home page remembers, without redirecting
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('last-branch')).toContainText('4-cü mikrorayon');
});

test('a branch without sauces offers none', async ({ page }) => {
  await page.goto('/4-mkr/');
  await page.locator('#menu').getByText('Bingo burger').first().click();
  await expect(page.getByRole('dialog', { name: 'Bingo burger' })).toBeVisible();
  await expect(page.getByText('Sousla daha dadlıdır')).toHaveCount(0);
  await page.goto('/gunesli/');
  await page.locator('#menu').getByText('Midburger').first().click();
  await expect(page.getByText('Sousla daha dadlıdır')).toBeVisible();
});
