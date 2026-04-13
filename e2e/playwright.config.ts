import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

dotenv.config({ path: path.join(__dirname, '.env') });

const isCiLike = Boolean(process.env.CI || process.env.JENKINS_URL || process.env.BUILD_URL);

const reporters: ReporterDescription[] = [
  ['html', { open: isCiLike ? 'never' : 'on-failure' }],
  ['json', { outputFile: 'test-results/results.json' }],
];

if (process.env.ZEPHYR_API_TOKEN?.trim()) {
  reporters.push(['./lib/zephyr-reporter.ts', {}]);
}

export default defineConfig({
  testDir: './tests',
  globalTeardown: './lib/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: isCiLike ? 2 : 0,
  workers: isCiLike ? 1 : undefined,
  reporter: reporters,
  use: {
    baseURL: process.env.UI_BASE_URL ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    headless: true,
    video: process.env.PLAYWRIGHT_VIDEO_FULL === '1' ? 'on' : 'retain-on-failure',
    screenshot: process.env.PLAYWRIGHT_SCREENSHOT === '1' ? 'on' : 'only-on-failure',
    launchOptions: {
      slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO ?? 0),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
