import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertStepLimit,
  deriveSubscriptionEntitlement,
  getRetentionCutoff,
} from '../src/lib/billing-policy';

test('step limits block workflows over the current plan cap', () => {
  assert.doesNotThrow(() => assertStepLimit('FREE', 5));
  assert.throws(
    () => assertStepLimit('FREE', 6),
    /supports up to 5 steps/
  );
  assert.doesNotThrow(() => assertStepLimit('PRO', 100));
});

test('active and trialing subscriptions grant the configured paid plan', () => {
  assert.deepEqual(deriveSubscriptionEntitlement({
    status: 'active',
    priceId: 'price_pro',
    planFromPrice: 'PRO',
  }), {
    plan: 'PRO',
    billingStatus: 'active',
    canUsePaidEntitlements: true,
    paymentIssue: false,
  });

  assert.deepEqual(deriveSubscriptionEntitlement({
    status: 'trialing',
    priceId: 'price_starter',
    planFromPrice: 'STARTER',
  }).plan, 'STARTER');
});

test('payment and cancellation states remove paid entitlements', () => {
  for (const status of ['past_due', 'unpaid', 'paused', 'incomplete', 'canceled']) {
    const entitlement = deriveSubscriptionEntitlement({
      status,
      priceId: 'price_pro',
      planFromPrice: 'PRO',
    });
    assert.equal(entitlement.plan, 'FREE');
    assert.equal(entitlement.canUsePaidEntitlements, false);
  }

  assert.equal(deriveSubscriptionEntitlement({
    status: 'past_due',
    priceId: 'price_pro',
    planFromPrice: 'PRO',
  }).paymentIssue, true);
});

test('retention cutoff is based on UTC calendar days', () => {
  const cutoff = getRetentionCutoff(7, new Date('2026-06-16T10:30:00.000Z'));
  assert.equal(cutoff.toISOString(), '2026-06-09T10:30:00.000Z');
});

