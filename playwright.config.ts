import { defineConfig, devices } from '@playwright/test';
import { hashSync } from 'bcryptjs';

// E2E runs against `next start` + an in-memory fake GitHub (scripts/mock-github.mjs):
// nothing here touches the real repository. Run `npm run build` first (npm run test:e2e does).
export const PASSWORD = 'test-parol-123';
export const MOCK = 'http://localhost:4020';
const PORT = 3200;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1, // one shared fake repo
  timeout: 60_000,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
  ],
  webServer: [
    {
      command: 'node scripts/mock-github.mjs',
      url: `${MOCK}/__mock/commits`,
      env: { MOCK_PORT: '4020', GITHUB_BRANCH: 'main' },
      reuseExistingServer: false,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/version.json`,
      env: {
        ADMIN_PASSWORD_HASH: Buffer.from(hashSync(PASSWORD, 4)).toString('base64'),
        SESSION_SECRET: 'e2e-session-secret-that-is-at-least-32-chars',
        GITHUB_TOKEN: 'mock-token',
        GITHUB_REPO: 'owner/danaburger',
        GITHUB_BRANCH: 'main',
        GITHUB_API_URL: MOCK,
      },
      reuseExistingServer: false,
    },
  ],
});
