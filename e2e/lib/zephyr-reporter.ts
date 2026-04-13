/**
 * Playwright custom reporter that publishes test results to Zephyr Scale.
 *
 * Title prefixes parsed:
 *   AP-E### → PUT /testexecutions/{key}  (execution key)
 *   AP-T### → POST or list+PUT           (test case key)
 *
 * Configuration (env):
 *   ZEPHYR_API_TOKEN, ZEPHYR_PROJECT_KEY, ZEPHYR_BASE_URL,
 *   ZEPHYR_TEST_CYCLE_KEY, ZEPHYR_ENVIRONMENT, ZEPHYR_ENABLED
 */

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';
import { ZephyrClient, type PublishResultParams } from '../utils/zephyr-client';

const ZEPHYR_EXECUTION_TITLE_REGEX = /^([A-Z][A-Z0-9]*-E\d+):\s/i;
const ZEPHYR_TEST_CASE_TITLE_REGEX = /^([A-Z][A-Z0-9]*-T\d+):\s/i;

function parseZephyrKeysFromTitle(
  title: string,
): { testExecutionKey?: string; testCaseKey?: string } | null {
  const execM = title.match(ZEPHYR_EXECUTION_TITLE_REGEX);
  if (execM) return { testExecutionKey: execM[1] };
  const caseM = title.match(ZEPHYR_TEST_CASE_TITLE_REGEX);
  if (caseM) return { testCaseKey: caseM[1] };
  return null;
}

const STATUS_MAP: Record<TestResult['status'], string> = {
  passed: 'Pass',
  failed: 'Fail',
  timedOut: 'Fail',
  interrupted: 'Blocked',
  skipped: 'Not Executed',
};

function formatTestError(e: TestError): string {
  if (e.message) return e.message;
  if (e.value) return e.value;
  if (e.stack) return e.stack;
  return JSON.stringify(e);
}

type PendingResult = Omit<PublishResultParams, 'testCycleKey'>;

function isCycleWithKey(value: unknown): value is { key: string } {
  return typeof value === 'object' && value !== null && 'key' in value && typeof (value as { key: unknown }).key === 'string';
}

export default class ZephyrReporter implements Reporter {
  private client: ZephyrClient | undefined;
  private projectKey = '';
  private readonly results: PendingResult[] = [];
  private enabled = false;

  onBegin(_config: FullConfig, _suite: Suite): void {
    const token = process.env.ZEPHYR_API_TOKEN;
    const projectKey = process.env.ZEPHYR_PROJECT_KEY;

    if (process.env.ZEPHYR_ENABLED === 'false') {
      console.info('[ZephyrReporter] Disabled via ZEPHYR_ENABLED=false');
      return;
    }
    if (!token || !projectKey) {
      console.info('[ZephyrReporter] Skipping — ZEPHYR_API_TOKEN or ZEPHYR_PROJECT_KEY not set');
      return;
    }

    this.enabled = true;
    this.projectKey = projectKey;
    this.client = new ZephyrClient({ token, projectKey, baseUrl: process.env.ZEPHYR_BASE_URL });
    console.info(`[ZephyrReporter] Enabled for project ${projectKey}`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.enabled) return;

    const parsed = parseZephyrKeysFromTitle(test.title);
    if (!parsed || (!parsed.testCaseKey && !parsed.testExecutionKey)) return;

    const statusName = STATUS_MAP[result.status] ?? 'Not Executed';
    const parts: string[] = [];

    if (result.status === 'failed' || result.status === 'timedOut') {
      const errorMessages = result.errors.map((e) => formatTestError(e)).join('\n---\n');
      parts.push(errorMessages ? `Failure:\n${errorMessages.substring(0, 3500)}` : 'Test failed');
    }

    this.results.push({
      testCaseKey: parsed.testCaseKey,
      testExecutionKey: parsed.testExecutionKey,
      statusName,
      comment: parts.join('\n\n'),
      executionTime: result.duration,
      environment: process.env.ZEPHYR_ENVIRONMENT ?? process.env.env,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.enabled || this.results.length === 0 || !this.client) return;

    try {
      const needCycle = this.results.some((r) => !r.testExecutionKey);
      let cycleKey: string | undefined;

      if (needCycle) {
        const existingCycleKey = process.env.ZEPHYR_TEST_CYCLE_KEY?.trim();
        if (existingCycleKey) {
          cycleKey = existingCycleKey;
        } else {
          const cycleName = `Playwright Run ${new Date().toISOString().replace(/[:.]/g, '-')}`;
          const cycle = await this.client.createTestCycle(
            cycleName,
            `Automated run — Status: ${result.status}, Total: ${this.results.length}`,
          );
          if (!isCycleWithKey(cycle)) throw new Error('Zephyr createTestCycle missing key');
          cycleKey = cycle.key;
          console.info(`[ZephyrReporter] Created cycle ${cycleKey}`);
        }
      }

      const executions: PublishResultParams[] = this.results.map((r) => ({
        testCaseKey: r.testCaseKey,
        testExecutionKey: r.testExecutionKey,
        statusName: r.statusName,
        comment: r.comment,
        executionTime: r.executionTime,
        environment: r.environment,
        testCycleKey: r.testExecutionKey ? undefined : cycleKey,
      }));

      const summary = await this.client.publishResults(executions);
      console.info(`[ZephyrReporter] Done — ${summary.succeeded} published, ${summary.failed} failed`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ZephyrReporter] Failed to publish results: ${message}`);
    }
  }
}
