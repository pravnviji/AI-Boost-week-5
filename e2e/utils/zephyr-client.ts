import * as http from 'node:http';
import * as https from 'node:https';
import { Buffer } from 'node:buffer';

/**
 * REST client for Zephyr Scale Cloud API v2.
 *
 * Configuration (env):
 *   ZEPHYR_API_TOKEN   - Zephyr Scale API token
 *   ZEPHYR_PROJECT_KEY - Jira project key (e.g. AP)
 *   ZEPHYR_BASE_URL    - default https://api.zephyrscale.smartbear.com/v2
 */
export type ZephyrClientOptions = {
  token: string;
  projectKey: string;
  baseUrl?: string;
};

export type PublishResultParams = {
  testCaseKey?: string;
  testExecutionKey?: string;
  testCycleKey?: string;
  statusName: string;
  comment?: string;
  executionTime?: number;
  environment?: string;
};

export type PublishResultsSummary = {
  succeeded: number;
  failed: number;
  errors: Array<{ testCaseKey?: string; testExecutionKey?: string; error: string }>;
};

const DEFAULT_BASE_URL = 'https://api.zephyrscale.smartbear.com/v2';

function executionItemsFromList(data: unknown): Array<Record<string, unknown>> {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.values)) return o.values as Array<Record<string, unknown>>;
  if (Array.isArray(o.results)) return o.results as Array<Record<string, unknown>>;
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  return [];
}

function findExecutionKeyForCase(listResponse: unknown): string | undefined {
  const items = executionItemsFromList(listResponse);
  for (const row of items) {
    const key = row.key;
    if (typeof key === 'string' && /^.+-E[0-9]+$/i.test(key)) return key;
    const id = row.id;
    if (typeof id === 'string' && id.length > 0) return id;
    if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  }
  return undefined;
}

export class ZephyrClient {
  private readonly token: string;
  private readonly projectKey: string;
  private readonly baseUrl: string;

  constructor({ token, projectKey, baseUrl }: ZephyrClientOptions) {
    if (!token) throw new Error('ZephyrClient: token is required');
    if (!projectKey) throw new Error('ZephyrClient: projectKey is required');
    this.token = token.trim();
    this.projectKey = projectKey.trim();
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  async createTestCycle(name: string, description?: string): Promise<unknown> {
    const body: Record<string, unknown> = { projectKey: this.projectKey, name };
    if (description) body.description = description;
    console.info(`[Zephyr] Creating test cycle: "${name}"`);
    return this.request('POST', '/testcycles', body);
  }

  async createTestCase(params: {
    name: string;
    objective?: string;
    folderId?: number;
    labels?: string[];
    customFields?: Record<string, unknown>;
  }): Promise<unknown> {
    const body: Record<string, unknown> = {
      projectKey: this.projectKey,
      name: params.name,
    };
    if (params.objective) body.objective = params.objective;
    if (params.folderId) body.folderId = params.folderId;
    if (params.labels) body.labels = params.labels;

    console.info(`[Zephyr] POST /testcases: "${params.name}"`);
    const result = await this.request('POST', '/testcases', body);

    if (params.customFields && result && typeof result === 'object') {
      const key = (result as Record<string, unknown>).key as string | undefined;
      if (key) {
        await this.updateTestCaseCustomFields(key, params.customFields);
      }
    }
    return result;
  }

  async listTestExecutions(testCycleKey: string, testCaseKey: string): Promise<unknown> {
    const q = new URLSearchParams({
      projectKey: this.projectKey,
      testCycle: testCycleKey,
      testCase: testCaseKey,
      maxResults: '100',
    });
    return this.request('GET', `/testexecutions?${q.toString()}`);
  }

  private buildUpdateBody(params: PublishResultParams): Record<string, unknown> {
    const actualEndDate = new Date().toISOString();
    const executedById = process.env.ZEPHYR_EXECUTED_BY_ID?.trim();
    const body: Record<string, unknown> = { statusName: params.statusName, actualEndDate };
    if (params.comment) body.comment = params.comment;
    if (params.executionTime != null) body.executionTime = params.executionTime;
    if (params.environment) body.environmentName = params.environment;
    if (executedById) body.executedById = executedById;
    return body;
  }

  async publishResult(params: PublishResultParams): Promise<unknown> {
    const updateBody = this.buildUpdateBody(params);

    if (params.testExecutionKey) {
      const path = `/testexecutions/${encodeURIComponent(params.testExecutionKey)}`;
      console.info(`[Zephyr] PUT ${params.statusName} → ${path}`);
      return this.request('PUT', path, updateBody);
    }

    const createBody: Record<string, unknown> = {
      projectKey: this.projectKey,
      testCaseKey: params.testCaseKey,
      testCycleKey: params.testCycleKey,
      statusName: params.statusName,
      actualEndDate: updateBody.actualEndDate,
    };
    if (params.comment) createBody.comment = params.comment;
    if (params.executionTime != null) createBody.executionTime = params.executionTime;
    if (params.environment) createBody.environmentName = params.environment;

    if (!params.testCaseKey || !params.testCycleKey) {
      throw new Error('Zephyr: POST requires testCaseKey and testCycleKey');
    }

    try {
      const list = await this.listTestExecutions(params.testCycleKey, params.testCaseKey);
      const executionKey = findExecutionKeyForCase(list);
      if (executionKey) {
        const path = `/testexecutions/${encodeURIComponent(executionKey)}`;
        try {
          console.info(`[Zephyr] PUT ${params.statusName} → ${path}`);
          return await this.request('PUT', path, updateBody);
        } catch {
          console.warn('[Zephyr] PUT failed; falling back to POST.');
        }
      }
    } catch {
      console.warn('[Zephyr] listTestExecutions failed; POST create.');
    }

    console.info(`[Zephyr] POST ${params.statusName} for ${params.testCaseKey}`);
    return this.request('POST', '/testexecutions', createBody);
  }

  async updateTestCaseCustomFields(
    testCaseKey: string,
    customFields: Record<string, unknown>,
  ): Promise<unknown> {
    const path = `/testcases/${encodeURIComponent(testCaseKey)}`;
    const existing = (await this.request('GET', path)) as Record<string, unknown> | null;
    if (!existing) throw new Error(`Zephyr: GET ${path} returned unexpected response`);

    const putBody: Record<string, unknown> = {
      ...existing,
      customFields: {
        ...(existing.customFields as Record<string, unknown> | undefined),
        ...customFields,
      },
    };
    console.info(`[Zephyr] PUT customFields → ${path}`);
    return this.request('PUT', path, putBody);
  }

  async listTestCases(params?: {
    folderId?: number;
    maxResults?: number;
  }): Promise<Array<{ key: string; name: string; folderId?: number; customFields?: Record<string, unknown> }>> {
    const pageSize = Math.min(params?.maxResults ?? 100, 100);
    let startAt = 0;
    const allCases: Array<{ key: string; name: string; folderId?: number; customFields?: Record<string, unknown> }> = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const q = new URLSearchParams({
        projectKey: this.projectKey,
        maxResults: String(pageSize),
        startAt: String(startAt),
      });
      if (params?.folderId) q.set('folderId', String(params.folderId));

      const data = (await this.request('GET', `/testcases?${q.toString()}`)) as Record<string, unknown> | null;
      const values = (data?.values ?? []) as Array<Record<string, unknown>>;

      for (const tc of values) {
        const folder = tc.folder as Record<string, unknown> | undefined;
        allCases.push({
          key: tc.key as string,
          name: tc.name as string,
          folderId: (folder?.id as number) ?? (tc.folderId as number) ?? undefined,
          customFields: tc.customFields as Record<string, unknown> | undefined,
        });
      }

      const isLast = data?.isLast as boolean | undefined;
      if (isLast || values.length < pageSize) break;
      startAt += pageSize;
    }
    return allCases;
  }

  async publishResults(results: PublishResultParams[]): Promise<PublishResultsSummary> {
    let succeeded = 0;
    let failed = 0;
    const errors: PublishResultsSummary['errors'] = [];

    for (const result of results) {
      try {
        await this.publishResult(result);
        succeeded += 1;
      } catch (err: unknown) {
        failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        errors.push({
          testCaseKey: result.testCaseKey,
          testExecutionKey: result.testExecutionKey,
          error: message,
        });
      }
    }
    console.info(`[Zephyr] Published ${succeeded}/${results.length} results (${failed} failed)`);
    return { succeeded, failed, errors };
  }

  private request(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${path}`);
      const isHttps = url.protocol === 'https:';
      const transport = isHttps ? https : http;

      const payload =
        body && Object.keys(body).length > 0 && method !== 'GET' ? JSON.stringify(body) : null;

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(payload)) }
            : {}),
        },
      };

      const req = transport.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString();
          const status = res.statusCode ?? 0;

          if (status === 204 || rawBody.length === 0) {
            if (status >= 200 && status < 300) { resolve(null); return; }
          }

          let parsed: unknown;
          try { parsed = JSON.parse(rawBody) as unknown; } catch { parsed = rawBody; }

          if (status >= 200 && status < 300) resolve(parsed);
          else {
            const msg = typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed) : String(parsed);
            reject(new Error(`Zephyr API ${status}: ${msg}`));
          }
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
}

export default ZephyrClient;
