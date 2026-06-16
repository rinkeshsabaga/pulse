import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import type { MemberRole } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Context Helpers
// ─────────────────────────────────────────────────────────────────────────────

export type AuthContext = {
  userId: string;       // Clerk user ID
  orgId: string;        // Clerk org ID
  orgSlug: string;      // e.g. "acme-corp"
  role: MemberRole;
  dbOrgId: string;      // Internal Prisma Organization.id
};

/**
 * Returns the full auth context for the current request.
 * Throws if user is not authenticated or has no active org selected.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: No authenticated user.');
  }
  if (!orgId || !orgSlug) {
    throw new Error('No organization selected. Please select or create an organization.');
  }

  // Map Clerk's org role string to our MemberRole enum
  const role = mapClerkRole(orgRole);

  // Look up our internal org record
  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true },
  });

  if (!org) {
    // This happens if the user created an org in Clerk but the DB sync failed or wasn't completed
    redirect('/onboarding?reason=db-missing');
  }

  return {
    userId,
    orgId,
    orgSlug,
    role,
    dbOrgId: org.id,
  };
}

/**
 * Same as getAuthContext() but returns null instead of throwing.
 * Useful for optional auth checks.
 */
export async function getAuthContextSafe(): Promise<AuthContext | null> {
  try {
    return await getAuthContext();
  } catch {
    return null;
  }
}

/**
 * Requires the user to have at least the given role.
 * Throws if they don't.
 */
export async function requireRole(minimumRole: MemberRole): Promise<AuthContext> {
  const ctx = await getAuthContext();
  const hierarchy: MemberRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
  const userLevel = hierarchy.indexOf(ctx.role);
  const requiredLevel = hierarchy.indexOf(minimumRole);

  if (userLevel < requiredLevel) {
    throw new Error(`Forbidden: requires ${minimumRole} role, you have ${ctx.role}.`);
  }
  return ctx;
}

/**
 * Maps Clerk's role string to our MemberRole enum.
 */
function mapClerkRole(clerkRole: string | null | undefined): MemberRole {
  switch (clerkRole) {
    case 'org:admin':
      return 'ADMIN';
    case 'org:member':
      return 'MEMBER';
    case 'org:viewer':
      return 'VIEWER';
    default:
      return 'MEMBER';
  }
}

/**
 * Gets the currently authenticated user's profile from Clerk.
 */
export async function getCurrentUser() {
  return currentUser();
}

/**
 * Retrieves the full organization record from the database.
 */
export async function getOrganization(dbOrgId: string) {
  return db.organization.findUnique({
    where: { id: dbOrgId },
    include: {
      _count: {
        select: { members: true, workflows: true },
      },
    },
  });
}
