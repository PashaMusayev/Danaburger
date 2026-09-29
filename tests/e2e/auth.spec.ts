import { expect, test } from '@playwright/test';

test.describe('auth', () => {
  test('admin pages redirect to login and are noindex', async ({ page }) => {
    await page.goto('/admin/settings/');
    await expect(page).toHaveURL(/\/admin\/login\/$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('wrong password shows how many tries are left', async ({ page }) => {
    await page.goto('/admin/login/');
    await page.fill('#pw', 'yanlis-parol');
    await page.getByRole('button', { name: 'Daxil ol' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Parol səhvdir' });
    await expect(alert).toContainText('4 cəhd qalıb');
  });

  test('blocks after 5 wrong passwords', async ({ request, baseURL }) => {
    const headers = { origin: baseURL!, 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` };
    for (let i = 0; i < 4; i++) expect((await request.post('/api/admin/login/', { headers, data: { password: 'x' } })).status()).toBe(401);
    const fifth = await request.post('/api/admin/login/', { headers, data: { password: 'x' } });
    expect(fifth.status()).toBe(429);
    // even the right password is refused while blocked
    const right = await request.post('/api/admin/login/', { headers, data: { password: 'test-parol-123' } });
    expect(right.status()).toBe(429);
    expect((await right.json()).error).toContain('dəqiqə');
  });

  test('API refuses requests without a session', async ({ request, baseURL }) => {
    for (const path of ['state', 'history']) expect((await request.get(`/api/admin/${path}/`)).status()).toBe(401);
    for (const path of ['publish', 'blob', 'revert']) {
      expect((await request.post(`/api/admin/${path}/`, { headers: { origin: baseURL! }, data: {} })).status()).toBe(401);
    }
  });

  test('API refuses cross-site POSTs even with the right password', async ({ request }) => {
    const res = await request.post('/api/admin/login/', { headers: { origin: 'https://evil.example' }, data: { password: 'test-parol-123' } });
    expect(res.status()).toBe(403);
  });
});
