/**
 * List Zephyr Scale test cases for the project, with optional folder filter.
 * Fetches the full test case including the `objective` field which contains
 * structured scenario JSON for automation.
 *
 * Usage:
 *   node docs/scenarios/list-zephyr-testcases.mjs
 *   node docs/scenarios/list-zephyr-testcases.mjs --folder="AI Boost Demo"
 *   node docs/scenarios/list-zephyr-testcases.mjs --folder="AI Boost Demo" --prefix="DEMO"
 *
 * Output (JSON array to stdout):
 *   [{
 *     "key": "AP-T161",
 *     "name": "FE - Dashboard - User clicks a task row...",
 *     "folderId": 123,
 *     "objective": { "id": "AP-T161", "title": "...", "userAction": "...", ... }
 *   }, ...]
 *
 * The `objective` field is parsed from JSON stored in the Zephyr test case objective.
 * If the objective is not valid JSON, it is returned as a raw string.
 *
 * Environment (loaded from e2e/.env):
 *   ZEPHYR_API_TOKEN   — Zephyr Scale API token
 *   ZEPHYR_PROJECT_KEY — Jira project key (default AP)
 *   ZEPHYR_BASE_URL    — optional
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// .env loader
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../e2e/.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const raw of lines) {
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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = (process.env.ZEPHYR_BASE_URL ?? 'https://api.zephyrscale.smartbear.com/v2').replace(/\/+$/, '');
const TOKEN = process.env.ZEPHYR_API_TOKEN ?? '';
const PROJECT_KEY = process.env.ZEPHYR_PROJECT_KEY ?? 'AP';

if (!TOKEN) {
  console.error('ZEPHYR_API_TOKEN is not set. Aborting.');
  process.exit(1);
}

/** @param {"GET"|"POST"|"PUT"} method @param {string} endpoint @param {object} [body] */
async function zephyrRequest(method, endpoint, body) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/json',
  };
  const options = { method, headers };
  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`Zephyr API ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
function parseArgs() {
  let folderName = '';
  let prefix = '';
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--folder=')) {
      folderName = arg.slice('--folder='.length).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--prefix=')) {
      prefix = arg.slice('--prefix='.length).replace(/^["']|["']$/g, '');
    }
  }
  return { folderName, prefix };
}

// ---------------------------------------------------------------------------
// Folder resolution
// ---------------------------------------------------------------------------
async function resolveFolderId(name) {
  if (!name) return undefined;
  const q = new URLSearchParams({
    projectKey: PROJECT_KEY,
    folderType: 'TEST_CASE',
    maxResults: '1000',
  });
  const data = await zephyrRequest('GET', `/folders?${q.toString()}`);
  const values = data?.values || [];
  const match = values.find((f) => f.name === name);
  if (match) {
    process.stderr.write(`Resolved folder "${name}" → id ${match.id}\n`);
    return match.id;
  }
  process.stderr.write(`⚠ Folder "${name}" not found in Zephyr.\n`);
  return undefined;
}

// ---------------------------------------------------------------------------
// Parse objective — try JSON first, fall back to raw string
// ---------------------------------------------------------------------------
function parseObjective(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Strip HTML that Zephyr's rich-text editor injects (&nbsp;, <br>, <p>, entities)
  const stripped = trimmed
    .replace(/<br[^>]*>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    return stripped;
  }
}

// ---------------------------------------------------------------------------
// Paginated test case listing
// ---------------------------------------------------------------------------
async function listAllTestCases(folderId) {
  const PAGE_SIZE = 100;
  let startAt = 0;
  const allCases = [];

  while (true) {
    const q = new URLSearchParams({
      projectKey: PROJECT_KEY,
      maxResults: String(PAGE_SIZE),
      startAt: String(startAt),
    });
    if (folderId) q.set('folderId', String(folderId));

    const data = await zephyrRequest('GET', `/testcases?${q.toString()}`);
    const values = data?.values || [];

    for (const tc of values) {
      allCases.push({
        key: tc.key,
        name: tc.name,
        folderId: tc.folder?.id ?? tc.folderId ?? null,
        objective: parseObjective(tc.objective),
        customFields: tc.customFields ?? {},
      });
    }

    process.stderr.write(`  Fetched ${allCases.length} / ${data?.total ?? '?'} test cases...\n`);

    if (data?.isLast || values.length < PAGE_SIZE) break;
    startAt += PAGE_SIZE;
  }

  return allCases;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { folderName, prefix } = parseArgs();
  const folderId = await resolveFolderId(folderName);

  process.stderr.write(`Fetching test cases for project ${PROJECT_KEY}...\n`);
  let testCases = await listAllTestCases(folderId);
  process.stderr.write(`Total: ${testCases.length} test case(s)\n`);

  if (prefix) {
    testCases = testCases.filter((tc) => tc.name.startsWith(prefix));
    process.stderr.write(`After --prefix="${prefix}" filter: ${testCases.length} test case(s)\n`);
  }

  process.stdout.write(JSON.stringify(testCases, null, 2) + '\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
