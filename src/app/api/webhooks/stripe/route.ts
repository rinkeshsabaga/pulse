import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripeClient, getPlanFromPriceId } from '@/lib/stripe';
import {
  deriveSubscriptionEntitlement,
  type PlanName,
} from '@/lib/billing-policy';
import {
  auditBillingEvent,
  syncClerkBillingMetadata,
  updateOrganizationBillingState,
} from '@/services/billing';
import { db } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/stripe
//
// Product behavior:
// - active/trialing subscriptions grant the purchased plan.
// - incomplete, past_due, unpaid, paused, and canceled subscriptions remove paid
//   entitlements by downgrading the org to FREE.
// - cancel-at-period-end keeps current paid access until Stripe sends deletion
//   or a non-entitled subscription status.
// - payment failures immediately move the org to FREE and sync a billing warning
//   to Clerk metadata.
// ─────────────────────────────────────────────────────────────────────────────

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe signature.';
    console.error('[stripe-webhook] Invalid signature:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await handleSubscriptionChanged(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('[stripe-webhook] Handler error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.orgId;
  if (!orgId || session.mode !== 'subscription') return;

  const stripeCustomerId = idFromStripeRef(session.customer);
  const stripeSubscriptionId = idFromStripeRef(session.subscription);

  const organization = await db.organization.update({
    where: { id: orgId },
    data: {
      ...(stripeCustomerId && { stripeCustomerId }),
      ...(stripeSubscriptionId && { stripeSubscriptionId }),
    },
    select: { plan: true },
  });

  await syncClerkBillingMetadata({
    organizationId: orgId,
    plan: organization.plan as PlanName,
    billingStatus: organization.plan === 'FREE' ? 'incomplete' : 'active',
    stripeCustomerId,
    stripeSubscriptionId,
    paymentIssue: false,
  });
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  const orgId = await getOrgIdForSubscription(subscription);
  if (!orgId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const entitlement = deriveSubscriptionEntitlement({
    status: subscription.status,
    priceId,
    planFromPrice: getPlanFromPriceId(priceId),
  });
  const stripeCustomerId = idFromStripeRef(subscription.customer);

  await updateOrganizationBillingState({
    organizationId: orgId,
    plan: entitlement.plan,
    billingStatus: entitlement.billingStatus,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: null,
    paymentIssue: entitlement.paymentIssue,
  });

  await auditBillingEvent({
    organizationId: orgId,
    action: 'billing.subscription.updated',
    metadata: {
      status: subscription.status,
      plan: entitlement.plan,
      priceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const orgId = await getOrgIdForSubscription(subscription);
  if (!orgId) return;

  await updateOrganizationBillingState({
    organizationId: orgId,
    plan: 'FREE',
    billingStatus: 'canceled',
    stripeCustomerId: idFromStripeRef(subscription.customer),
    stripeSubscriptionId: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    paymentIssue: false,
  });

  await auditBillingEvent({
    organizationId: orgId,
    action: 'billing.subscription.deleted',
    metadata: { status: subscription.status, subscriptionId: subscription.id },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = idFromStripeRef(invoice.customer);
  if (!stripeCustomerId) return;

  const org = await db.organization.findFirst({
    where: { stripeCustomerId },
    select: { id: true, stripeSubscriptionId: true },
  });
  if (!org) return;

  await updateOrganizationBillingState({
    organizationId: org.id,
    plan: 'FREE',
    billingStatus: 'past_due',
    stripeCustomerId,
    stripeSubscriptionId: org.stripeSubscriptionId,
    paymentIssue: true,
  });

  await auditBillingEvent({
    organizationId: org.id,
    action: 'billing.payment_failed',
    metadata: {
      invoiceId: invoice.id,
      customerId: stripeCustomerId,
      amountDue: invoice.amount_due,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    },
  });
}

async function getOrgIdForSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const metadataOrgId = typeof subscription.metadata?.orgId === 'string' ? subscription.metadata.orgId : null;
  if (metadataOrgId) return metadataOrgId;

  const stripeCustomerId = idFromStripeRef(subscription.customer);
  if (!stripeCustomerId) return null;

  const org = await db.organization.findFirst({
    where: { stripeCustomerId },
    select: { id: true },
  });
  return org?.id ?? null;
}

function idFromStripeRef(value: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id;
}
