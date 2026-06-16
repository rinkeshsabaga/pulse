import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { syncClerkBillingMetadata } from '@/services/billing';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organizations/create
// Called from the onboarding page after creating an org in Clerk.
// Creates the matching Prisma Organization + OWNER Member record.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { clerkOrgId, name, slug } = body;

  if (!clerkOrgId || !name || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Ensure slug is unique
  let finalSlug = slug;
  let counter = 1;
  while (true) {
    const existingSlug = await db.organization.findUnique({ where: { slug: finalSlug } });
    if (!existingSlug) break;
    finalSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    counter++;
    if (counter > 10) break; // Fallback to avoid infinite loops
  }

  try {
    // Check if org already exists (idempotent)
    const existing = await db.organization.findUnique({ where: { clerkOrgId } });
    if (existing) {
      return NextResponse.json({ organization: existing }, { status: 200 });
    }

    // Create org + owner member in a transaction
    const organization = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          clerkOrgId,
          name,
          slug: finalSlug,
          plan: 'FREE',
        },
      });

      await tx.member.create({
        data: {
          clerkUserId: userId,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      // Log the creation
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          clerkUserId: userId,
          action: 'organization.create',
          resourceType: 'organization',
          resourceId: org.id,
          metadata: { name, slug: finalSlug },
        },
      });

      return org;
    });

    await syncClerkBillingMetadata({
      organizationId: organization.id,
      plan: 'FREE',
      billingStatus: 'free',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paymentIssue: false,
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error: any) {
    console.error('[organizations/create]', error);
    return NextResponse.json(
      { error: 'Failed to create organization', details: error.message },
      { status: 500 }
    );
  }
}
