'use server';

import { db } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import type { Prisma, RunStatus } from '@prisma/client';
import type { WorkflowStepData } from '@/lib/types';
import { createHash } from 'crypto';
import { buildRunSeries, type RunSeriesPoint } from '@/lib/run-monitoring';
import { getRetentionCutoff, PLAN_LIMITS, type PlanName } from '@/lib/billing-policy';
import { pruneExpiredRuns } from '@/services/usage';

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Runs Service
// ─────────────────────────────────────────────────────────────────────────────

export type StepLog = {
  executionId: string;
  stepId: string;
  stepTitle: string;
  status: 'success' | 'failed' | 'skipped' | 'running';
  startedAt: string;    // ISO string
  finishedAt?: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
};

export type WorkflowRunRecord = {
  id: string;
  workflowId: string;
  organizationId: string;
  status: RunStatus;
  trigger: string;
  triggerData: Record<string, unknown> | null;
  stepLogs: StepLog[];
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  error: string | null;
  inngestRunId: string | null;
  workflow?: { name: string };
};

export async function getWorkflowRuns(opts?: {
  workflowId?: string;
  limit?: number;
  status?: RunStatus;
}): Promise<WorkflowRunRecord[]> {
  const { dbOrgId } = await getAuthContext();
  const retentionCutoff = await getRunRetentionCutoff(dbOrgId);

  const runs = await db.workflowRun.findMany({
    where: {
      organizationId: dbOrgId,
      startedAt: { gte: retentionCutoff },
      ...(opts?.workflowId && { workflowId: opts.workflowId }),
      ...(opts?.status && { status: opts.status }),
    },
    include: { workflow: { select: { name: true } } },
    orderBy: { startedAt: 'desc' },
    take: opts?.limit ?? 50,
  });

  return runs.map(parseRun);
}

export async function getWorkflowRunById(id: string): Promise<WorkflowRunRecord | null> {
  const { dbOrgId } = await getAuthContext();
  const retentionCutoff = await getRunRetentionCutoff(dbOrgId);

  const run = await db.workflowRun.findFirst({
    where: { id, organizationId: dbOrgId, startedAt: { gte: retentionCutoff } },
    include: { workflow: { select: { name: true } } },
  });

  return run ? parseRun(run) : null;
}

/**
 * Creates a new run record. Called at the start of execution.
 */
export async function createRun(data: {
  workflowId: string;
  organizationId: string;
  trigger: string;
  triggerData?: Record<string, unknown>;
  inngestRunId?: string;
}): Promise<WorkflowRunRecord> {
  const createData = {
    ...(data.inngestRunId && { id: deterministicRunId(data.inngestRunId) }),
    workflowId: data.workflowId,
    organizationId: data.organizationId,
    status: 'RUNNING' as const,
    trigger: data.trigger,
    triggerData: (data.triggerData ?? {}) as Prisma.InputJsonValue,
    stepLogs: [],
    inngestRunId: data.inngestRunId ?? null,
  };

  const run = data.inngestRunId
    ? await db.workflowRun.upsert({
        where: { id: deterministicRunId(data.inngestRunId) },
        update: {},
        create: createData,
        include: { workflow: { select: { name: true } } },
      })
    : await db.workflowRun.create({
        data: createData,
        include: { workflow: { select: { name: true } } },
      });

  return parseRun(run);
}

/**
 * Updates a run's status and step logs. Called during + after execution.
 */
export async function updateRun(
  id: string,
  update: {
    status?: RunStatus;
    stepLogs?: StepLog[];
    error?: string;
    finishedAt?: Date;
    durationMs?: number;
  }
): Promise<void> {
  const finishedAt = update.finishedAt ?? (
    update.status === 'SUCCESS' || update.status === 'FAILED' || update.status === 'CANCELLED'
      ? new Date()
      : undefined
  );

  await db.workflowRun.update({
    where: { id },
    data: {
      ...(update.status && { status: update.status }),
      ...(update.stepLogs && { stepLogs: JSON.parse(JSON.stringify(update.stepLogs)) }),
      ...(update.error && { error: update.error }),
      ...(finishedAt && { finishedAt }),
      ...(update.durationMs !== undefined && { durationMs: update.durationMs }),
    },
  });

  // Update lastRunAt + lastRunStatus on the workflow too
  if (update.status === 'SUCCESS' || update.status === 'FAILED') {
    const run = await db.workflowRun.findUnique({
      where: { id },
      select: { workflowId: true, organizationId: true, startedAt: true },
    });
    if (run) {
      await db.workflow.update({
        where: { id: run.workflowId },
        data: { lastRunAt: run.startedAt, lastRunStatus: update.status },
      });
      await pruneExpiredRuns(run.organizationId);
    }
  }
}

/**
 * Dashboard metric: runs per day for the last N days.
 */
export async function getRunsPerDay(days = 7): Promise<RunSeriesPoint[]> {
  const { dbOrgId } = await getAuthContext();
  const now = new Date();
  const since = new Date(now);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - Math.max(1, days) + 1);

  const runs = await db.workflowRun.findMany({
    where: { organizationId: dbOrgId, startedAt: { gte: since } },
    select: { startedAt: true, status: true },
  });

  return buildRunSeries(runs, days, now);
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseRun(run: any): WorkflowRunRecord {
  return {
    ...run,
    triggerData: run.triggerData as Record<string, unknown> | null,
    stepLogs: (run.stepLogs as StepLog[]) ?? [],
  };
}

function deterministicRunId(inngestEventId: string): string {
  return `run_${createHash('sha256').update(inngestEventId).digest('hex').slice(0, 24)}`;
}

async function getRunRetentionCutoff(orgId: string): Promise<Date> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');
  return getRetentionCutoff(PLAN_LIMITS[org.plan as PlanName].retentionDays);
}
