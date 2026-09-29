import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { MOCK, PASSWORD } from '../../playwright.config';

export const resetRepo = (request: APIRequestContext) => request.post(`${MOCK}/__mock/reset`);
export const repoFile = async (request: APIRequestContext, path: string) => (await (await request.get(`${MOCK}/__mock/file?path=${path}`)).json()) as { text: string; sha: string };
export const repoCommits = async (request: APIRequestContext) =>
  (await (await request.get(`${MOCK}/__mock/commits`)).json()) as { sha: string; message: string; files: string[] }[];

export async function login(page: Page) {
  await page.goto('/admin/');
  await expect(page).toHaveURL(/\/admin\/login\/$/);
  await page.fill('#pw', PASSWORD);
  await page.getByRole('button', { name: 'Daxil ol' }).click();
  await expect(page.getByRole('heading', { name: 'Menyu', exact: true, level: 1 })).toBeVisible();
}

export const itemLine = (menuText: string, id: string) => menuText.split('\n').find((l) => l.includes(`{"id": "${id}"`)) ?? '';

export async function expectValues(locator: import('@playwright/test').Locator, values: string[]) {
  await expect(locator).toHaveCount(values.length);
  for (const [i, v] of values.entries()) await expect(locator.nth(i)).toHaveValue(v);
}
