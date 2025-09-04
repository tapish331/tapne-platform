import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Config file lives in tests/e2e, so testDir is '.'
  testDir: '.',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },
});
