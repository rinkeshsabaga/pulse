import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPortalSession } from '@/lib/stripe';

// POST /api/billing/portal — open Stripe Customer Portal
export async function POST(request: NextRequest) {
  try {
    const { dbOrgId } = await getAuthContext();

    const org = await db.organization.findUnique({
      where: { id: dbOrgId },
      select: { stripeCustomerId: true },
    });

    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please upgrade to a paid plan first.' },
        { status: 400 }
      );
    }

    const session = await createPortalSession({
      customerId: org.stripeCustomerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[billing/portal]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
