import type { CredentialType } from '@prisma/client';
import { getNangoClient } from '@/lib/nango';
import { getNangoIntegrationKey } from '@/lib/nango-config';
import { buildIntegrationActionRequest } from '@/lib/integration-actions';

export type IntegrationCredential = {
  type: CredentialType;
  nangoConnectionId: string | null;
  secrets: Record<string, unknown>;
};

export type IntegrationExecutionOutput = {
  status: number;
  data: unknown;
  provider: string;
  action: string;
};

export async function executeIntegrationAction(args: {
  appName: string;
  action: string;
  params: Record<string, unknown>;
  credential: IntegrationCredential;
}): Promise<IntegrationExecutionOutput> {
  const request = buildIntegrationActionRequest(args.appName, args.action, args.params);

  if (args.credential.type === 'OAUTH') {
    const providerConfigKey = getNangoIntegrationKey(args.appName);
    if (!providerConfigKey) throw new Error(`OAuth is not configured for ${args.appName}.`);
    if (!args.credential.nangoConnectionId) throw new Error(`OAuth connection for ${args.appName} is incomplete.`);

    const response = await getNangoClient().proxy({
      providerConfigKey,
      connectionId: args.credential.nangoConnectionId,
      method: request.method,
      endpoint: request.endpoint,
      data: request.data,
      params: request.query,
      headers: request.headers,
      retries: 2,
    });

    assertProviderSuccess(response.data);
    return {
      status: response.status,
      data: response.data,
      provider: args.appName,
      action: args.action,
    };
  }

  if (args.credential.type !== 'API_KEY' && args.credential.type !== 'BASIC_AUTH') {
    throw new Error(`${args.credential.type.replace('_', ' ')} credentials cannot authenticate app actions.`);
  }

  if (!request.directBaseUrl) {
    throw new Error(`Parameter "${args.appName === 'Salesforce' ? 'instanceUrl' : 'baseUrl'}" is required for non-OAuth ${args.appName} credentials.`);
  }

  const url = buildDirectUrl(request.directBaseUrl, request.endpoint, request.query);
  const headers: Record<string, string> = { Accept: 'application/json', ...(request.headers ?? {}) };
  const apiKey = secretString(args.credential.secrets, 'apiKey');
  const apiSecret = secretString(args.credential.secrets, 'apiSecret');

  if (args.credential.type === 'BASIC_AUTH') {
    const username = secretString(args.credential.secrets, 'username');
    const password = secretString(args.credential.secrets, 'password');
    if (!username || !password) throw new Error('Basic authentication credential is incomplete.');
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  } else if (args.appName === 'Trello') {
    if (!apiKey || !apiSecret) throw new Error('Trello API key and token are required.');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('token', apiSecret);
  } else if (args.appName === 'WooCommerce' && apiSecret) {
    if (!apiKey) throw new Error('WooCommerce consumer key is missing.');
    url.searchParams.set('consumer_key', apiKey);
    url.searchParams.set('consumer_secret', apiSecret);
  } else if (args.appName === 'Shopify') {
    if (!apiKey) throw new Error('Shopify access token is missing.');
    headers['X-Shopify-Access-Token'] = apiKey;
  } else if (args.appName === 'Freshdesk') {
    if (!apiKey) throw new Error('Freshdesk API key is missing.');
    headers.Authorization = `Basic ${Buffer.from(`${apiKey}:X`).toString('base64')}`;
  } else {
    if (!apiKey) throw new Error(`${args.appName} API key is missing.`);
    headers.Authorization = args.appName === 'Discord' ? `Bot ${apiKey}` : `Bearer ${apiKey}`;
  }

  if (args.appName === 'GitHub') {
    headers['X-GitHub-Api-Version'] = '2022-11-28';
  }

  let body: string | undefined;
  if (request.data !== undefined) {
    if (request.bodyFormat === 'form') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = formEncode(request.data);
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(request.data);
    }
  }

  const response = await fetch(url, { method: request.method, headers, body });
  const responseText = await response.text();
  const responseData = parseResponseBody(responseText);

  if (!response.ok) {
    throw new Error(`${args.appName} returned HTTP ${response.status}: ${providerErrorMessage(responseData)}`);
  }
  assertProviderSuccess(responseData);

  return {
    status: response.status,
    data: responseData,
    provider: args.appName,
    action: args.action,
  };
}

function formEncode(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Form-encoded integration payloads must be objects.');
  }

  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(value)) {
    if (rawValue === undefined || rawValue === null) continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) params.append(key, String(item));
    } else {
      params.set(key, String(rawValue));
    }
  }
  return params.toString();
}

function buildDirectUrl(
  baseUrl: string,
  endpoint: string,
  query?: Record<string, string | number | string[] | number[]>
): URL {
  const base = new URL(baseUrl);
  assertAllowedHost(base);
  const url = new URL(endpoint, `${base.origin}/`);

  for (const [key, rawValue] of Object.entries(query ?? {})) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) url.searchParams.append(key, String(value));
  }
  return url;
}

/**
 * Blocks requests to localhost, private IPs, link-local addresses, and non-HTTPS
 * endpoints. Prevents SSRF when fetching user-provided or integration URLs.
 */
export function assertAllowedHost(url: URL) {
  const hostname = url.hostname.toLowerCase();
  const blocked = hostname === 'localhost' || hostname.endsWith('.local') ||
    /^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname === '::1' || hostname === '[::1]' || hostname === '0.0.0.0';

  if (url.protocol !== 'https:' || blocked) {
    throw new Error('Request URL must be a public HTTPS endpoint. Internal, private, and non-HTTPS URLs are blocked.');
  }
}

function secretString(secrets: Record<string, unknown>, key: string): string {
  const value = secrets[key];
  return typeof value === 'string' ? value : '';
}

function parseResponseBody(value: string): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function assertProviderSuccess(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;
  const record = data as Record<string, unknown>;
  if (record.ok === false) {
    throw new Error(providerErrorMessage(data));
  }
}

function providerErrorMessage(data: unknown): string {
  if (typeof data === 'string') return data.slice(0, 500);
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    const message = record.message ?? record.error ?? record.error_description;
    if (typeof message === 'string') return message.slice(0, 500);
  }
  return 'Provider request failed.';
}
