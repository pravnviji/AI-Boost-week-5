import {
  test as base,
  expect,
  type Page,
  type PlaywrightTestArgs,
  type PlaywrightWorkerArgs,
} from '@playwright/test';

type E2EFixtures = {
  /** Page navigated to the app base URL. */
  authenticatedPage: Page;
};

/** Full fixture map passed to test callbacks. */
export type E2ETestFixtures = PlaywrightTestArgs & PlaywrightWorkerArgs & E2EFixtures;

export const test = base.extend<E2EFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const homeUrl = process.env.UI_BASE_URL ?? 'http://localhost:4200';
    await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });
    await use(page);
  },
});

export { expect };
