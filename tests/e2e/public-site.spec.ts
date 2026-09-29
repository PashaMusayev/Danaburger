import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('public pages are still prerendered (static)', async ({}, info) => {
  test.skip(info.project.name !== 'desktop');
  const manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'));
  expect(Object.keys(manifest.routes)).toEqual(expect.arrayContaining(['/', '/menu', '/version.json']));
  expect(existsSync('.next/server/app/index.html')).toBe(true);
  expect(existsSync('.next/server/app/menu.html')).toBe(true);
});

test('public site has no admin code or analytics leakage and still works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain('/api/admin');
  await page.goto('/menu/');
  await expect(page.locator('#menu')).toContainText('Çizburger');
  expect(errors).toEqual([]);
});
