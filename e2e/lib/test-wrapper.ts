/**
 * Test wrapper for shared conventions (Zephyr key prefix, env gating, per-test timeout).
 *
 * Usage:
 *   appTest({
 *     zephyrTestCaseKey: "AP-T001",
 *     name: "Page Load - User navigates to Dashboard",
 *     fn: async ({ authenticatedPage }) => { ... },
 *   });
 */

import { test as base, expect, type E2ETestFixtures } from '../fixtures';
import type { TestInfo } from '@playwright/test';

function resolveEnv(): string {
  return process.env.E2E_ENV ?? process.env.NODE_ENV ?? 'local';
}

export type AppTestFixtures = E2ETestFixtures & { env: string };

export type AppTestOptions = {
  /** Zephyr test case key (AP-T###). */
  zephyrTestCaseKey?: string;
  /** Zephyr test execution key (AP-E###). */
  zephyrExecutionKey?: string;
  name: string;
  validEnvs?: string[];
  invalidEnvs?: string[];
  timeout?: number;
  fn: (fixtures: AppTestFixtures, testInfo: TestInfo) => Promise<void>;
};

export function appTest(options: AppTestOptions): void {
  const { name, zephyrExecutionKey, zephyrTestCaseKey, validEnvs, invalidEnvs, timeout, fn } =
    options;

  if (!name || typeof fn !== 'function') {
    throw new Error('appTest requires "name" and "fn"');
  }

  const title = zephyrExecutionKey
    ? `${zephyrExecutionKey}: ${name}`
    : zephyrTestCaseKey
      ? `${zephyrTestCaseKey}: ${name}`
      : name;

  base(title, async ({ page, context, request, browser, playwright, authenticatedPage }, testInfo) => {
    const env = resolveEnv();

    if (timeout !== undefined) testInfo.setTimeout(timeout);

    const merged: AppTestFixtures = {
      page,
      context,
      request,
      browser,
      playwright,
      authenticatedPage,
      env,
    };

    if (Array.isArray(validEnvs) && validEnvs.length > 0 && !validEnvs.includes(env)) {
      testInfo.skip(true, `Env ${env} not in validEnvs [${validEnvs.join(', ')}]`);
    }
    if (Array.isArray(invalidEnvs) && invalidEnvs.length > 0 && invalidEnvs.includes(env)) {
      testInfo.skip(true, `Env ${env} is in invalidEnvs [${invalidEnvs.join(', ')}]`);
    }

    await fn(merged, testInfo);
  });
}

export { expect };
