import Stripe from 'stripe';
import {
  PLAN_LIMITS,
  getPlanLimits,
  isUnlimited,
  type PlanLimits,
  type PlanName,
} from '@/lib/billing-policy';
import { getFeatureEnv } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Client + Plan Configuration
// ─────────────────────────────────────────────────────────────────────────────

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(getFeatureEnv('STRIPE_SECRET_KEY', 'Stripe'), {
    apiVersion: '2026-05-27.dahlia',
    typescript: true,
  });
  return stripeClient;
}

export { PLAN_LIMITS, getPlanLimits, isUnlimited };
export type { PlanLimits, PlanName };

// ─── Stripe Price IDs ──────────────────────────────────────────────────────────
// Set these in your .env.local after creating products in the Stripe dashboard.

export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  STARTER_MONTHLY: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
  STARTER_YEARLY: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
};

export function getPriceIdForPlan(plan: PlanName, billing: 'monthly' | 'yearly'): string | undefined {
  return STRIPE_PRICE_IDS[`${plan}_${billing.toUpperCase()}`];
}

export function getPlanFromPriceId(priceId: string | null | undefined): PlanName | null {
  if (!priceId) return null;
  for (const [key, configuredPriceId] of Object.entries(STRIPE_PRICE_IDS)) {
    if (configuredPriceId === priceId) return key.split('_')[0] as PlanName;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout session for upgrading to a paid plan.
 */
export async function createCheckoutSession(opts: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  orgId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return getStripeClient().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    ...(opts.customerId
      ? { customer: opts.customerId }
      : { customer_email: opts.customerEmail }),
    line_items: [{ price: opts.priceId, quantity: 1 }],
    metadata: { orgId: opts.orgId },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    subscription_data: {
      metadata: { orgId: opts.orgId },
    },
  });
}

/**
 * Creates a Stripe Customer Portal session for managing subscription.
 */
export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}) {
  return getStripeClient().billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}
