#!/usr/bin/env node
/**
 * Update the "Automation Status" custom field on Zephyr Scale test cases for
 * Playwright tests that passed in the latest run.
 *
 * Reads the JSON reporter output (`e2e/test-results/results.json` by default),
 * extracts the Zephyr test-case key (e.g. `AP-T163`) from each test title, and
 * for every passing key calls `PUT /testcases/{key}` with the merged custom
 * fields so the field flips from "Not Automated" → "Automated".
 *
 * Optionally also sets the test-case `status` (shown under "Details" in the
 * Zephyr UI, e.g. Draft / Approved / Deprecated) to a configured workflow state
 * for every passing key. Enable by passing `--testcase-status=Approved` (or
 * setting `ZEPHYR_PASS_TESTCASE_STATUS`).
 *
 * Usage (from repo root):
 *   node docs/scenarios/update-zephyr-automation-status.mjs
 *   node docs/scenarios/update-zephyr-automation-status.mjs --dry-run
 *   node docs/scenarios/update-zephyr-automation-status.mjs --results=path/to/results.json --status=Automated
 *   node docs/scenarios/update-zephyr-automation-status.mjs --testcase-status=Approved
 *
 * Environment (loaded from e2e/.env):
 *   ZEPHYR_API_TOKEN              — Zephyr Scale API token
 *   ZEPHYR_PROJECT_KEY            — Jira project key (default AP)
 *   ZEPHYR_BASE_URL               — optional (default https://api.zephyrscale.smartbear.com/v2)
 *   ZEPHYR_AUTOMATION_FIELD       — custom field name (default "Automation Status")
 *   ZEPHYR_AUTOMATION_PASS_VALUE  — value to set on pass (default "Automated")
 *   ZEPHYR_PASS_TESTCASE_STATUS   — optional; test-case Status name on pass (e.g. "Approved")
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

function loadEnv() {
  const envPath = path.resolve(REPO_ROOT, 'e2e/.env');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const BASE_URL = (process.env.ZEPHYR_BASE_URL ?? 'https://api.zephyrscale.smartbear.com/v2').replace(/\/+$/, '');
const TOKEN = process.env.ZEPHYR_API_TOKEN ?? '';
const PROJECT_KEY = process.env.ZEPHYR_PROJECT_KEY ?? 'AP';
const AUTOMATION_FIELD = process.env.ZEPHYR_AUTOMATION_FIELD ?? 'Automation Status';
const DEFAULT_PASS_VALUE = process.env.ZEPHYR_AUTOMATION_PASS_VALUE ?? 'Automated';
const DEFAULT_TESTCASE_STATUS = process.env.ZEPHYR_PASS_TESTCASE_STATUS ?? '';

function parseArgs() {
  const args = {
    resultsPath: path.join(REPO_ROOT, 'e2e/test-results/results.json'),
    status: DEFAULT_PASS_VALUE,
    testcaseStatus: DEFAULT_TESTCASE_STATUS,
    dryRun: false,
  };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--results=')) args.resultsPath = path.resolve(arg.slice('--results='.length).replace(/^["']|["']$/g, ''));
    else if (arg.startsWith('--status=')) args.status = arg.slice('--status='.length).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--testcase-status=')) args.testcaseStatus = arg.slice('--testcase-status='.length).replace(/^["']|["']$/g, '');
  }
  return args;
}

async function zephyrRequest(method, endpoint, body) {
  if (!TOKEN) throw new Error('ZEPHYR_API_TOKEN is not set');
  const url = `${BASE_URL}${endpoint}`;
  const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };
  const options = { method, headers };
  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`Zephyr API ${res.status} ${method} ${endpoint}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------------------
// Results parsing
// ---------------------------------------------------------------------------
const KEY_REGEX = /\b([A-Z][A-Z0-9]*-T\d+)\b/;

/** Recursively walk a Playwright JSON report and yield { key, status }. */
function* iterateTestResults(node) {
  if (!node || typeof node !== 'object') return;
  for (const suite of node.suites ?? []) {
    yield* iterateTestResults(suite);
  }
  for (const spec of node.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const title = spec.title ?? '';
      const match = title.match(KEY_REGEX);
      if (!match) continue;
      const key = match[1];
      const attempts = test.results ?? [];
      const lastStatus = attempts.length > 0 ? attempts[attempts.length - 1].status : 'unknown';
      yield { key, status: lastStatus, title };
    }
  }
}

function collectPassedKeys(report) {
  const passed = new Map();
  const failed = new Set();
  for (const { key, status } of iterateTestResults(report)) {
    if (status === 'passed') {
      if (!failed.has(key)) passed.set(key, (passed.get(key) ?? 0) + 1);
    } else {
      failed.add(key);
      passed.delete(key);
    }
  }
  return { passedKeys: [...passed.keys()].sort(), failedKeys: [...failed].sort() };
}

// ---------------------------------------------------------------------------
// Zephyr update
// ---------------------------------------------------------------------------

/** Cache of test-case status name → id for the current project. */
let testCaseStatusesCache = null;

async function getTestCaseStatusId(name) {
  if (!testCaseStatusesCache) {
    const res = await zephyrRequest(
      'GET',
      `/statuses?projectKey=${encodeURIComponent(PROJECT_KEY)}&statusType=TEST_CASE&maxResults=100`,
    );
    const values = Array.isArray(res?.values) ? res.values : [];
    testCaseStatusesCache = new Map(values.map((s) => [String(s.name).toLowerCase(), s.id]));
  }
  const id = testCaseStatusesCache.get(String(name).toLowerCase());
  if (!id) {
    const available = [...testCaseStatusesCache.keys()].join(', ') || '(none)';
    throw new Error(`Test-case status "${name}" not found for project ${PROJECT_KEY}. Available: ${available}`);
  }
  return id;
}

async function updateAutomationStatus(key, desiredStatus, testcaseStatus, dryRun) {
  const endpoint = `/testcases/${encodeURIComponent(key)}`;
  const existing = await zephyrRequest('GET', endpoint);
  if (!existing || typeof existing !== 'object') {
    throw new Error(`${key}: unexpected response from GET ${endpoint}`);
  }
  const currentCustom = existing.customFields && typeof existing.customFields === 'object' ? existing.customFields : {};
  const currentAutomation = currentCustom[AUTOMATION_FIELD];
  const currentStatusId = existing.status?.id;

  let desiredStatusId;
  if (testcaseStatus) {
    desiredStatusId = await getTestCaseStatusId(testcaseStatus);
  }

  const automationChanged = currentAutomation !== desiredStatus;
  const statusChanged = desiredStatusId !== undefined && currentStatusId !== desiredStatusId;

  if (!automationChanged && !statusChanged) {
    return {
      key,
      changed: false,
      automation: { previous: currentAutomation, next: desiredStatus },
      status: testcaseStatus ? { previous: currentStatusId, next: desiredStatusId } : null,
    };
  }

  const putBody = {
    ...existing,
    customFields: { ...currentCustom, [AUTOMATION_FIELD]: desiredStatus },
    ...(desiredStatusId !== undefined ? { status: { id: desiredStatusId } } : {}),
  };

  if (dryRun) {
    return {
      key,
      changed: true,
      dryRun: true,
      automation: { previous: currentAutomation, next: desiredStatus, changed: automationChanged },
      status: testcaseStatus
        ? { previous: currentStatusId, next: desiredStatusId, changed: statusChanged, name: testcaseStatus }
        : null,
    };
  }

  await zephyrRequest('PUT', endpoint, putBody);
  return {
    key,
    changed: true,
    automation: { previous: currentAutomation, next: desiredStatus, changed: automationChanged },
    status: testcaseStatus
      ? { previous: currentStatusId, next: desiredStatusId, changed: statusChanged, name: testcaseStatus }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { resultsPath, status, testcaseStatus, dryRun } = parseArgs();

  if (!fs.existsSync(resultsPath)) {
    console.error(`Results file not found: ${resultsPath}`);
    console.error('Run `npx playwright test` first (the json reporter writes this file).');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const { passedKeys, failedKeys } = collectPassedKeys(report);

  console.info(`Results: ${resultsPath}`);
  console.info(`Project: ${PROJECT_KEY} — field "${AUTOMATION_FIELD}" → "${status}"${dryRun ? ' (dry-run)' : ''}`);
  if (testcaseStatus) {
    console.info(`Project: ${PROJECT_KEY} — test-case Status → "${testcaseStatus}"${dryRun ? ' (dry-run)' : ''}`);
  }
  console.info(`Passed test cases: ${passedKeys.length}${passedKeys.length ? ' [' + passedKeys.join(', ') + ']' : ''}`);
  if (failedKeys.length) {
    console.info(`Skipped (failed/other): ${failedKeys.length} [${failedKeys.join(', ')}]`);
  }

  if (passedKeys.length === 0) {
    console.info('Nothing to update.');
    return;
  }

  let updated = 0;
  let unchanged = 0;
  const errors = [];
  for (const key of passedKeys) {
    try {
      const res = await updateAutomationStatus(key, status, testcaseStatus, dryRun);
      const parts = [];
      if (res.automation?.changed) {
        parts.push(`Automation "${res.automation.previous ?? '—'}" → "${res.automation.next}"`);
      } else {
        parts.push(`Automation already "${res.automation.next}"`);
      }
      if (res.status) {
        if (res.status.changed) {
          parts.push(`Status id ${res.status.previous ?? '—'} → ${res.status.next} (${res.status.name})`);
        } else {
          parts.push(`Status already "${res.status.name}"`);
        }
      }

      if (res.changed) {
        updated += 1;
        console.info(`  ✓ ${key}: ${parts.join('; ')}${dryRun ? ' (dry-run)' : ''}`);
      } else {
        unchanged += 1;
        console.info(`  = ${key}: ${parts.join('; ')}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ key, message });
      console.error(`  ✗ ${key}: ${message}`);
    }
  }

  console.info(`Done — ${updated} updated, ${unchanged} unchanged, ${errors.length} errored`);
  if (errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
