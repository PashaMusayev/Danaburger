import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': import.meta.dirname,
      // server-only throws outside Next's server bundle; in unit tests it's just a marker
      'server-only': `${import.meta.dirname}/tests/unit/empty.ts`,
    },
  },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
