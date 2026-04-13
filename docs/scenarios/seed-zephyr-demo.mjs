/**
 * Seed demo test cases into Zephyr Scale under the "AI Boost Demo" folder.
 *
 * Each test case's `objective` field stores a structured JSON scenario object
 * that the "Run Automate" skill reads to generate Playwright tests.
 *
 * Usage:
 *   node docs/scenarios/seed-zephyr-demo.mjs
 *
 * Prerequisite: set ZEPHYR_API_TOKEN in e2e/.env (or export it).
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

const BASE_URL = (process.env.ZEPHYR_BASE_URL ?? 'https://api.zephyrscale.smartbear.com/v2').replace(/\/+$/, '');
const TOKEN = process.env.ZEPHYR_API_TOKEN ?? '';
const PROJECT_KEY = process.env.ZEPHYR_PROJECT_KEY ?? 'AP';
const DEMO_FOLDER_NAME = 'AI Boost Demo';

if (!TOKEN) {
  console.error('ZEPHYR_API_TOKEN is not set. Set it in e2e/.env or export it.');
  process.exit(1);
}

async function zephyrRequest(method, endpoint, body) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };
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
// Folder management
// ---------------------------------------------------------------------------
async function findOrCreateFolder(name) {
  const q = new URLSearchParams({
    projectKey: PROJECT_KEY,
    folderType: 'TEST_CASE',
    maxResults: '1000',
  });
  const data = await zephyrRequest('GET', `/folders?${q.toString()}`);
  const existing = (data?.values || []).find((f) => f.name === name);
  if (existing) {
    console.log(`✓ Folder "${name}" already exists (id: ${existing.id})`);
    return existing.id;
  }

  console.log(`Creating folder "${name}"...`);
  const created = await zephyrRequest('POST', '/folders', {
    projectKey: PROJECT_KEY,
    name,
    folderType: 'TEST_CASE',
  });
  console.log(`✓ Created folder "${name}" (id: ${created.id})`);
  return created.id;
}

// ---------------------------------------------------------------------------
// Test case management
// ---------------------------------------------------------------------------
async function listExistingCases(folderId) {
  const q = new URLSearchParams({
    projectKey: PROJECT_KEY,
    folderId: String(folderId),
    maxResults: '100',
  });
  const data = await zephyrRequest('GET', `/testcases?${q.toString()}`);
  return (data?.values || []).map((tc) => ({ key: tc.key, name: tc.name }));
}

async function createTestCase(name, objectiveJson, folderId) {
  const body = {
    projectKey: PROJECT_KEY,
    name,
    objective: JSON.stringify(objectiveJson),
    folderId,
    labels: ['ai-boost-demo'],
    customFields: { 'Automation Status': 'Not Automated' },
  };
  console.log(`  Creating: "${name}"...`);
  const result = await zephyrRequest('POST', '/testcases', body);
  console.log(`  ✓ Created ${result.key}: "${name}"`);
  return result;
}

// ---------------------------------------------------------------------------
// Demo test cases — objective contains the full scenario JSON
// ---------------------------------------------------------------------------
const DEMO_CASES = [
  {
    name: 'FE - Dashboard - User navigates to Dashboard and sees summary cards',
    objective: {
      title: 'User navigates to Dashboard and sees summary cards',
      userAction: 'User opens the Dashboard page from the sidebar navigation',
      expectedOutcome: 'Summary cards display Total Tasks, Completed, In Progress, and Pending counts; recent tasks table is visible',
      sourceFiles: [
        'src/frontend/src/app/dashboard/dashboard.component.html',
        'src/frontend/src/app/dashboard/dashboard.component.ts',
      ],
      testFile: null,
      testReference: null,
    },
  },
  {
    name: 'FE - Dashboard - User clicks a task row and navigates to task detail',
    objective: {
      title: 'User clicks a task row and navigates to task detail',
      userAction: 'User clicks a task name link in the recent tasks table',
      expectedOutcome: 'Browser navigates to /tasks/:id, task detail page is displayed with the correct task name',
      sourceFiles: [
        'src/frontend/src/app/dashboard/dashboard.component.html',
        'src/frontend/src/app/dashboard/dashboard.component.ts',
      ],
      testFile: null,
      testReference: null,
    },
  },
  {
    name: 'FE - Dashboard - User navigates between Dashboard and Tasks via sidebar',
    objective: {
      title: 'User navigates between Dashboard and Tasks via sidebar',
      userAction: 'User clicks Tasks in the sidebar, then clicks Dashboard in the sidebar',
      expectedOutcome: 'Each page loads correctly with its title visible; URL updates to /tasks then /dashboard',
      sourceFiles: [
        'src/frontend/src/app/app.component.html',
        'src/frontend/src/app/app.component.ts',
      ],
      testFile: null,
      testReference: null,
    },
  },
  {
    name: 'FE - Task List - User navigates to Task List and sees all tasks',
    objective: {
      title: 'User navigates to Task List and sees all tasks',
      userAction: 'User clicks Tasks in the sidebar navigation',
      expectedOutcome: "Task list page displays with title 'Tasks', table shows all tasks with Name, Status, Priority, Due Date columns",
      sourceFiles: [
        'src/frontend/src/app/tasks/task-list/task-list.component.html',
        'src/frontend/src/app/tasks/task-list/task-list.component.ts',
      ],
      testFile: null,
      testReference: null,
    },
  },
  {
    name: 'FE - Task List - User applies status filter and table updates',
    objective: {
      title: 'User applies status filter and table updates',
      userAction: "User selects 'Completed' from the Status filter dropdown",
      expectedOutcome: "Table shows only tasks with status 'Completed', other tasks are hidden",
      sourceFiles: [
        'src/frontend/src/app/tasks/task-list/task-list.component.html',
        'src/frontend/src/app/tasks/task-list/task-list.component.ts',
        'src/frontend/src/app/services/task.service.ts',
      ],
      testFile: null,
      testReference: null,
    },
  },
  {
    name: 'FE - Task List - User clears filters and all tasks reappear',
    objective: {
      title: 'User clears filters and all tasks reappear',
      userAction: 'User clicks the Clear Filters button',
      expectedOutcome: "All filter selections reset to 'All', table shows all tasks again",
      sourceFiles: [
        'src/frontend/src/app/tasks/task-list/task-list.component.html',
        'src/frontend/src/app/tasks/task-list/task-list.component.ts',
      ],
      testFile: null,
      testReference: null,
    },
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeeding demo test cases into Zephyr (project: ${PROJECT_KEY})\n`);

  const folderId = await findOrCreateFolder(DEMO_FOLDER_NAME);
  const existing = await listExistingCases(folderId);
  const existingNames = new Set(existing.map((tc) => tc.name));

  console.log(`\nExisting cases in folder: ${existing.length}`);

  const created = [];
  for (const demo of DEMO_CASES) {
    if (existingNames.has(demo.name)) {
      const match = existing.find((tc) => tc.name === demo.name);
      console.log(`  ⏩ Skipped (exists): ${match.key} — "${demo.name}"`);
      created.push({ key: match.key, name: demo.name });
      continue;
    }
    const result = await createTestCase(demo.name, demo.objective, folderId);
    created.push({ key: result.key, name: demo.name });
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Zephyr test cases for demo:');
  console.log('═══════════════════════════════════════════════════');
  for (const { key, name } of created) {
    console.log(`  ${key}: ${name}`);
  }
  console.log('═══════════════════════════════════════════════════');
  console.log('\nUpdate docs/scenarios/*.scenarios.json IDs to match');
  console.log('the Zephyr keys above, then run "Run Automate".\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
