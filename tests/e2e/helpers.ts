import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { MOCK, PASSWORD } from '../../playwright.config';

export const resetRepo = (request: APIRequestContext) => request.post(`${MOCK}/__mock/reset`);
export const repoFile = async (request: APIRequestContext, path: string) => (await (await request.get(`${MOCK}/__mock/file?path=${path}`)).json()) as { text: string; sha: string };
export const repoCommits = async (request: APIRequestContext) =>
  (await (await request.get(`${MOCK}/__mock/commits`)).json()) as { sha: string; message: string; files: string[] }[];

/** blob sha of every data file, to prove which files a publish touched */
export async function dataShas(request: APIRequestContext) {
  const paths = ['data/menu.json', 'data/branches.json', 'data/settings.json', 'data/branches/gunesli.json', 'data/branches/narimanov.json', 'data/branches/4-mkr.json'];
  return Object.fromEntries(await Promise.all(paths.map(async (p) => [p, (await repoFile(request, p)).sha])));
}

export async function login(page: Page) {
  await page.goto('/admin/');
  await expect(page).toHaveURL(/\/admin\/login\/$/);
  await page.fill('#pw', PASSWORD);
  await page.getByRole('button', { name: 'Daxil ol' }).click();
  await expect(page.getByRole('heading', { name: 'Menyu', exact: true, level: 1 })).toBeVisible();
}

export async function selectBranch(page: Page, name: string) {
  await page.getByRole('tab', { name: new RegExp(name) }).click();
  await expect(page.getByRole('tab', { name: new RegExp(name) })).toHaveAttribute('aria-selected', 'true');
}

export const itemLine = (text: string, id: string) => text.split('\n').find((l) => l.includes(`{"id": "${id}"`)) ?? '';

export async function expectValues(locator: Locator, values: string[]) {
  await expect(locator).toHaveCount(values.length);
  for (const [i, v] of values.entries()) await expect(locator.nth(i)).toHaveValue(v);
}
