import assert from 'node:assert/strict';
import test from 'node:test';
import { APP_DEFINITIONS } from '../src/lib/app-definitions';
import {
  buildIntegrationActionRequest,
  getIntegrationActionGuide,
  validateIntegrationActionParams,
} from '../src/lib/integration-actions';
import { executeIntegrationAction } from '../src/lib/integration-executor';

const firstPackApps = [
  'Shopify',
  'WooCommerce',
  'Gmail',
  'Google Sheets',
  'Slack',
  'Twilio WhatsApp',
  'HubSpot',
  'Stripe',
  'Airtable',
  'Notion',
  'Zendesk',
  'Freshdesk',
  'Discord',
  'Trello',
  'Asana',
];

test('first SMB integration pack is available in the app registry', () => {
  const configured = new Set(APP_DEFINITIONS.map((app) => app.name));

  for (const appName of firstPackApps) {
    assert.ok(configured.has(appName), `${appName} is missing from APP_DEFINITIONS`);
  }
});

test('every configured app action has an executable request definition', () => {
  for (const app of APP_DEFINITIONS) {
    for (const action of app.actions) {
      const guide = getIntegrationActionGuide(app.name, action.value);
      assert.ok(guide, `${app.name}:${action.value} is missing an action guide`);
      assert.doesNotThrow(() => buildIntegrationActionRequest(app.name, action.value, guide.example));
    }
  }
});

test('builds provider-specific endpoints and payloads', () => {
  const slack = buildIntegrationActionRequest('Slack', 'send_message', {
    channel: '#operations',
    text: 'Workflow finished',
  });
  assert.equal(slack.method, 'POST');
  assert.equal(slack.endpoint, '/api/chat.postMessage');
  assert.deepEqual(slack.data, { channel: '#operations', text: 'Workflow finished' });

  const github = buildIntegrationActionRequest('GitHub', 'create_pr_comment', {
    owner: 'sabaga labs',
    repo: 'pulse',
    pullNumber: 12,
    body: 'Ready to merge',
  });
  assert.equal(github.endpoint, '/repos/sabaga%20labs/pulse/issues/12/comments');

  const shopify = buildIntegrationActionRequest('Shopify', 'create_customer', {
    storeUrl: 'https://demo.myshopify.com',
    email: 'ada@example.com',
    firstName: 'Ada',
  });
  assert.equal(shopify.endpoint, '/admin/api/2024-10/customers.json');
  assert.deepEqual(shopify.data, {
    customer: { email: 'ada@example.com', first_name: 'Ada' },
  });

  const twilio = buildIntegrationActionRequest('Twilio WhatsApp', 'send_whatsapp_message', {
    accountSid: 'AC123',
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+15551234567',
    body: 'Packed and shipped',
  });
  assert.equal(twilio.bodyFormat, 'form');
  assert.equal(twilio.endpoint, '/2010-04-01/Accounts/AC123/Messages.json');

  const notion = buildIntegrationActionRequest('Notion', 'create_page', {
    parent: { database_id: 'database-id' },
    properties: { Name: { title: [{ text: { content: 'Lead' } }] } },
  });
  assert.equal(notion.headers?.['Notion-Version'], '2022-06-28');
});

test('rejects unsupported actions and missing required parameters', () => {
  assert.deepEqual(
    validateIntegrationActionParams('Slack', 'send_message', { channel: '#general' }),
    ['Parameter "text" is required.']
  );
  assert.throws(
    () => buildIntegrationActionRequest('Slack', 'delete_workspace', {}),
    /Unsupported action/
  );
});

test('executes API-key actions without returning the secret', async () => {
  const originalFetch = globalThis.fetch;
  let authorization = '';
  globalThis.fetch = async (_input, init) => {
    authorization = new Headers(init?.headers).get('authorization') ?? '';
    return new Response(JSON.stringify({ ok: true, ts: '123.456' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const result = await executeIntegrationAction({
      appName: 'Slack',
      action: 'send_message',
      params: { channel: '#general', text: 'Hello' },
      credential: { type: 'API_KEY', nangoConnectionId: null, secrets: { apiKey: 'secret-token' } },
    });
    assert.equal(authorization, 'Bearer secret-token');
    assert.equal(result.status, 200);
    assert.equal(JSON.stringify(result).includes('secret-token'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('executes provider-specific direct auth and form payloads', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; headers: Headers; body: string }> = [];

  globalThis.fetch = async (input, init) => {
    requests.push({
      url: input instanceof URL ? input.toString() : String(input),
      headers: new Headers(init?.headers),
      body: String(init?.body ?? ''),
    });
    return new Response(JSON.stringify({ ok: true, id: 'provider-id' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    await executeIntegrationAction({
      appName: 'Shopify',
      action: 'create_customer',
      params: { storeUrl: 'https://demo.myshopify.com', email: 'ada@example.com' },
      credential: { type: 'API_KEY', nangoConnectionId: null, secrets: { apiKey: 'shopify-token' } },
    });
    assert.equal(requests.at(-1)?.headers.get('x-shopify-access-token'), 'shopify-token');
    assert.equal(JSON.stringify(requests.at(-1)).includes('shopify-token'), false);

    await executeIntegrationAction({
      appName: 'Stripe',
      action: 'create_invoice_item',
      params: { customerId: 'cus_123', amount: 5000, currency: 'usd' },
      credential: { type: 'API_KEY', nangoConnectionId: null, secrets: { apiKey: 'sk_test_secret' } },
    });
    assert.equal(requests.at(-1)?.headers.get('content-type'), 'application/x-www-form-urlencoded');
    assert.equal(requests.at(-1)?.body, 'customer=cus_123&amount=5000&currency=usd');

    await executeIntegrationAction({
      appName: 'WooCommerce',
      action: 'update_order_status',
      params: { storeUrl: 'https://shop.example.com', orderId: '42', status: 'completed' },
      credential: { type: 'API_KEY', nangoConnectionId: null, secrets: { apiKey: 'ck_key', apiSecret: 'cs_secret' } },
    });
    const wooUrl = new URL(requests.at(-1)?.url ?? '');
    assert.equal(wooUrl.searchParams.get('consumer_key'), 'ck_key');
    assert.equal(wooUrl.searchParams.get('consumer_secret'), 'cs_secret');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
