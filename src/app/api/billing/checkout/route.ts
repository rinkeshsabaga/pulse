import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { createCheckoutSession, getPriceIdForPlan } from '@/lib/stripe';
import type { PlanName } from '@/lib/billing-policy';

const PAID_SELF_SERVE_PLANS: PlanName[] = ['STARTER', 'PRO'];
const PLAN_ORDER: PlanName[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

// POST /api/billing/checkout — create Stripe Checkout session
export async function POST(request: NextRequest) {
  try {
    const { dbOrgId } = await getAuthContext();
    const { plan, billing } = (await request.json()) as {
      plan: PlanName;
      billing: 'monthly' | 'yearly';
    };

    if (!PAID_SELF_SERVE_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'This plan is not available through self-serve checkout.' }, { status: 400 });
    }

    const priceId = getPriceIdForPlan(plan, billing);
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 });
    }

    const org = await db.organization.findUnique({
      where: { id: dbOrgId },
      select: { stripeCustomerId: true, plan: true },
    });
    const currentPlan = (org?.plan ?? 'FREE') as PlanName;
    if (PLAN_ORDER.indexOf(plan) <= PLAN_ORDER.indexOf(currentPlan)) {
      return NextResponse.json(
        { error: 'Use the billing portal to change or cancel an existing paid subscription.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

    const session = await createCheckoutSession({
      priceId,
      orgId: dbOrgId,
      customerId: org?.stripeCustomerId ?? undefined,
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl: `${appUrl}/billing?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[billing/checkout]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
