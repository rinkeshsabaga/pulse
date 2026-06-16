'use server';

import { db } from '@/lib/db';
import {
  PLAN_LIMITS,
  assertStepLimit,
  getRetentionCutoff,
  isUnlimited,
  type PlanName,
} from '@/lib/billing-policy';
import type { WorkflowStepData } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Quota & Usage Service
// Enforces plan limits and tracks credit usage.
// ─────────────────────────────────────────────────────────────────────────────

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns how many workflow runs have been used this month for an org.
 */
export async function getRunsUsedThisMonth(orgId: string): Promise<number> {
  const period = currentPeriod();
  const result = await db.usageRecord.aggregate({
    where: { organizationId: orgId, period },
    _sum: { creditsUsed: true },
  });
  return result._sum.creditsUsed ?? 0;
}

/**
 * Returns how many workflows exist for an org.
 */
export async function getWorkflowCount(orgId: string): Promise<number> {
  return db.workflow.count({ where: { organizationId: orgId } });
}

/**
 * Returns the number of members in an org.
 */
export async function getMemberCount(orgId: string): Promise<number> {
  return db.member.count({ where: { organizationId: orgId } });
}

export async function getMaxWorkflowStepCount(orgId: string): Promise<number> {
  const workflows = await db.workflow.findMany({
    where: { organizationId: orgId },
    select: { steps: true },
  });
  return workflows.reduce((max, workflow) => {
    const steps = Array.isArray(workflow.steps) ? workflow.steps.length : 0;
    return Math.max(max, steps);
  }, 0);
}

/**
 * Checks if an org can create another workflow.
 * Throws a descriptive error if they've hit the plan limit.
 */
export async function checkWorkflowLimit(orgId: string): Promise<void> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');

  const limits = PLAN_LIMITS[org.plan as PlanName];
  if (isUnlimited(limits.workflows)) return;

  const count = await getWorkflowCount(orgId);
  if (count >= limits.workflows) {
    throw new Error(
      `You've reached the ${limits.workflows}-workflow limit on the ${limits.displayName} plan. Upgrade to create more workflows.`
    );
  }
}

export async function checkWorkflowStepLimit(orgId: string, steps: WorkflowStepData[]): Promise<void> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');
  assertStepLimit(org.plan as PlanName, steps.length);
}

/**
 * Checks if an org can start another workflow run this month.
 * Throws a descriptive error if they've hit the plan limit.
 */
export async function checkRunLimit(orgId: string): Promise<void> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');

  const limits = PLAN_LIMITS[org.plan as PlanName];
  if (isUnlimited(limits.runsPerMonth)) return;

  const used = await getRunsUsedThisMonth(orgId);
  if (used >= limits.runsPerMonth) {
    throw new Error(
      `You've used all ${limits.runsPerMonth.toLocaleString()} runs this month on the ${limits.displayName} plan. Upgrade for more runs.`
    );
  }
}

export async function checkWorkflowRunEntitlement(orgId: string, steps: WorkflowStepData[]): Promise<void> {
  await checkWorkflowStepLimit(orgId, steps);
  await checkRunLimit(orgId);
}

/**
 * Checks if an org can add another team member.
 * Throws if they've hit the plan limit.
 */
export async function checkMemberLimit(orgId: string): Promise<void> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');

  const limits = PLAN_LIMITS[org.plan as PlanName];
  if (isUnlimited(limits.teamMembers)) return;

  const count = await getMemberCount(orgId);
  if (count >= limits.teamMembers) {
    throw new Error(
      `Your ${limits.displayName} plan supports up to ${limits.teamMembers} team member(s). Upgrade to invite more.`
    );
  }
}

/**
 * Records usage after a successful workflow run.
 */
export async function recordRunUsage(opts: {
  orgId: string;
  runId: string;
  creditsUsed?: number;
}): Promise<void> {
  const existing = await db.usageRecord.findFirst({
    where: { organizationId: opts.orgId, workflowRunId: opts.runId },
    select: { id: true },
  });
  if (existing) return;

  await db.usageRecord.create({
    data: {
      organizationId: opts.orgId,
      workflowRunId: opts.runId,
      creditsUsed: opts.creditsUsed ?? 1,
      period: currentPeriod(),
    },
  });

  await pruneExpiredRuns(opts.orgId);
}

export async function pruneExpiredRuns(orgId: string): Promise<number> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');

  const retentionDays = PLAN_LIMITS[org.plan as PlanName].retentionDays;
  const cutoff = getRetentionCutoff(retentionDays);
  const result = await db.workflowRun.deleteMany({
    where: {
      organizationId: orgId,
      startedAt: { lt: cutoff },
      status: { in: ['SUCCESS', 'FAILED', 'CANCELLED', 'TIMED_OUT'] },
    },
  });
  return result.count;
}

/**
 * Returns a full usage summary for the current month.
 * Used on the billing + dashboard pages.
 */
export async function getUsageSummary(orgId: string) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org) throw new Error('Organization not found');

  const limits = PLAN_LIMITS[org.plan as PlanName];

  const [runsUsed, workflowCount, memberCount, maxWorkflowStepCount] = await Promise.all([
    getRunsUsedThisMonth(orgId),
    getWorkflowCount(orgId),
    getMemberCount(orgId),
    getMaxWorkflowStepCount(orgId),
  ]);

  return {
    plan: org.plan as PlanName,
    limits,
    usage: {
      runs: { used: runsUsed, limit: limits.runsPerMonth },
      workflows: { used: workflowCount, limit: limits.workflows },
      members: { used: memberCount, limit: limits.teamMembers },
      stepsPerWorkflow: { used: maxWorkflowStepCount, limit: limits.stepsPerWorkflow },
      retentionDays: { used: 0, limit: limits.retentionDays },
    },
  };
}
