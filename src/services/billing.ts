'use server';

import { clerkClient } from '@clerk/nextjs/server';
import type { Plan, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { BillingStatus, PlanName } from '@/lib/billing-policy';

type BillingSyncInput = {
  organizationId: string;
  plan: PlanName;
  billingStatus: BillingStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  paymentIssue?: boolean;
};

export async function syncClerkBillingMetadata(input: BillingSyncInput): Promise<void> {
  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    select: { clerkOrgId: true },
  });
  if (!organization) return;

  try {
    const client = await clerkClient();
    await client.organizations.updateOrganizationMetadata(organization.clerkOrgId, {
      publicMetadata: {
        plan: input.plan,
        billingStatus: input.billingStatus,
        cancelAtPeriodEnd: Boolean(input.cancelAtPeriodEnd),
        currentPeriodEnd: input.currentPeriodEnd ?? null,
        paymentIssue: Boolean(input.paymentIssue),
      },
      privateMetadata: {
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      },
    });
  } catch (error) {
    console.warn('[billing] Failed to sync Clerk organization metadata:', error);
  }
}

export async function updateOrganizationBillingState(input: BillingSyncInput): Promise<void> {
  await db.organization.update({
    where: { id: input.organizationId },
    data: {
      plan: input.plan as Plan,
      ...(input.stripeCustomerId !== undefined && { stripeCustomerId: input.stripeCustomerId }),
      ...(input.stripeSubscriptionId !== undefined && { stripeSubscriptionId: input.stripeSubscriptionId }),
    },
  });

  await syncClerkBillingMetadata(input);
}

export async function auditBillingEvent(input: {
  organizationId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      clerkUserId: 'system:stripe',
      action: input.action,
      resourceType: 'billing',
      resourceId: input.organizationId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
