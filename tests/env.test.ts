import assert from 'node:assert/strict';
import test from 'node:test';
import { getFeatureEnv, validateServerEnv } from '../src/lib/env';

const validRequiredEnv = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/pulse',
  CLERK_SECRET_KEY: 'sk_test_real_value',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_real_value',
  ENCRYPTION_KEY: 'a'.repeat(64),
};

test('validates required server environment variables', () => {
  const result = validateServerEnv(validRequiredEnv);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects missing required values and invalid encryption keys', () => {
  const result = validateServerEnv({
    ...validRequiredEnv,
    DATABASE_URL: '',
    ENCRYPTION_KEY: 'short',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('DATABASE_URL is required.'));
  assert.ok(result.errors.includes('ENCRYPTION_KEY must be a 64-character hex string.'));
});

test('warns for incomplete optional feature groups without failing required env', () => {
  const result = validateServerEnv(validRequiredEnv, { includeOptional: true });

  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((warning) => warning.includes('stripe is not fully configured')));
});

test('strict optional validation fails placeholder feature values', () => {
  const result = validateServerEnv({
    ...validRequiredEnv,
    STRICT_ENV_VALIDATION: 'true',
    STRIPE_SECRET_KEY: 'sk_test_replace_me',
  }, { includeOptional: true });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('stripe is not fully configured')));
});

test('feature env access rejects placeholder values', () => {
  const original = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = 'sk_test_replace_me';

  try {
    assert.throws(
      () => getFeatureEnv('STRIPE_SECRET_KEY', 'Stripe'),
      /Stripe requires STRIPE_SECRET_KEY/
    );
  } finally {
    if (original === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = original;
    }
  }
});
