#!/usr/bin/env node
/**
 * Execute a Playwright test by Zephyr Scale key and sync the result back to Zephyr.
 *
 * Flow:
 *   1. Run `npx playwright test -g <KEY>` (ZephyrReporter auto-publishes the
 *      execution result to the configured test cycle when ZEPHYR_API_TOKEN is set).
 *   2. Run `docs/scenarios/update-zephyr-automation-status.mjs` to flip the
 *      "Automation Status" custom field to "Automated" for any key that passed.
 *
 * Usage (from repo root or e2e/):
 *   node e2e/scripts/execute.mjs AP-T163
 *   npm --prefix e2e run execute -- AP-T163
 *
 * Exits non-zero if either step fails.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const E2E_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(E2E_DIR, '..');

const ZEPHYR_KEY_REGEX = /^[A-Z][A-Z0-9]*-(T|E)\d+$/;

function parseArgs() {
  const args = process.argv.slice(2);
  let key;
  const passthrough = [];
  for (const arg of args) {
    if (!key && ZEPHYR_KEY_REGEX.test(arg)) {
      key = arg;
    } else {
      passthrough.push(arg);
    }
  }
  return { key, passthrough };
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`Failed to spawn ${command}: ${err.message}`);
      resolve(1);
    });
  });
}

async function main() {
  const { key, passthrough } = parseArgs();

  if (!key) {
    console.error('Usage: node e2e/scripts/execute.mjs <ZEPHYR_KEY> [extra playwright args]');
    console.error('Example: node e2e/scripts/execute.mjs AP-T163');
    process.exit(2);
  }

  console.info(`▶ Running Playwright test matching "${key}"`);
  // Note: don't pass `--reporter` on the CLI — it replaces (not augments) the
  // reporters configured in `playwright.config.ts`, which include the JSON
  // reporter writing to `test-results/results.json` and the Zephyr reporter.
  const playwrightExit = await run(
    'npx',
    ['playwright', 'test', '-g', key, ...passthrough],
    { cwd: E2E_DIR },
  );

  if (playwrightExit !== 0) {
    console.warn(`⚠ Playwright exited with code ${playwrightExit}; still attempting Zephyr sync.`);
  }

  const testcaseStatus = process.env.ZEPHYR_PASS_TESTCASE_STATUS ?? 'Approved';
  console.info(`\n▶ Syncing Zephyr — Automation Status → "Automated"; Details → Status → "${testcaseStatus}"`);
  const syncExit = await run(
    'node',
    [
      path.join(REPO_ROOT, 'docs/scenarios/update-zephyr-automation-status.mjs'),
      `--testcase-status=${testcaseStatus}`,
    ],
    { cwd: REPO_ROOT },
  );

  const finalExit = playwrightExit || syncExit;
  if (finalExit === 0) {
    console.info(`\n✔ ${key}: test passed and Zephyr synced.`);
  } else {
    console.error(`\n✘ ${key}: finished with errors (playwright=${playwrightExit}, sync=${syncExit}).`);
  }
  process.exit(finalExit);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
