import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  verifyBase64HmacSha256Signature,
  verifyPulseWebhookSignature,
} from '../src/lib/webhook-signature';

test('verifies Pulse webhook signatures with HMAC SHA-256', () => {
  const body = JSON.stringify({ event: 'created' });
  const secret = 'webhook-secret';
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

  assert.equal(verifyPulseWebhookSignature(secret, body, signature), true);
});

test('rejects missing, malformed, and mismatched Pulse webhook signatures', () => {
  const body = JSON.stringify({ event: 'created' });
  const secret = 'webhook-secret';

  assert.equal(verifyPulseWebhookSignature(secret, body, null), false);
  assert.equal(verifyPulseWebhookSignature(secret, body, 'bad-signature'), false);
  assert.equal(verifyPulseWebhookSignature(secret, body, 'sha256=bad'), false);
});

test('verifies WooCommerce-style base64 HMAC SHA-256 signatures', () => {
  const body = JSON.stringify({ id: 123, status: 'processing' });
  const secret = 'woocommerce-secret';
  const signature = createHmac('sha256', secret).update(body).digest('base64');

  assert.equal(verifyBase64HmacSha256Signature(secret, body, signature), true);
  assert.equal(verifyBase64HmacSha256Signature(secret, body, null), false);
  assert.equal(verifyBase64HmacSha256Signature(secret, body, 'wrong-signature'), false);
});
