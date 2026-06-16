'use server';

import { db } from '@/lib/db';
import { getAuthContext, requireRole } from '@/lib/auth';
import { randomBytes } from 'crypto';
import type { WorkflowStatus, WorkflowVersion } from '@prisma/client';
import type { WorkflowStepData } from '@/lib/types';
import type { Node, Edge } from 'reactflow';
import { dedupeVersionsByNumber, workflowGraphsEqual } from '@/lib/workflow-versioning';
import { assertStepLimit, type PlanName } from '@/lib/billing-policy';

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Service — Real Prisma queries replacing the mock db.ts
// ─────────────────────────────────────────────────────────────────────────────

const workflowTransactionOptions = {
  isolationLevel: 'Serializable' as const,
  maxWait: 10_000,
  timeout: 15_000,
};

export type WorkflowRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  steps: WorkflowStepData[];
  nodes: Node[] | null;
  edges: Edge[] | null;
  version: number;
  webhookSecret: string | null;
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  history: WorkflowVersionRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type WorkflowVersionRecord = {
  id: string;
  workflowId: string;
  version: number;
  steps: WorkflowStepData[];
  date: Date;
  createdAt: Date;
};

export async function getWorkflows(): Promise<WorkflowRecord[]> {
  const { dbOrgId } = await getAuthContext();

  const workflows = await db.workflow.findMany({
    where: { organizationId: dbOrgId },
    include: { history: { orderBy: [{ version: 'desc' }, { createdAt: 'asc' }] } },
    orderBy: { updatedAt: 'desc' },
  });

  return workflows.map(parseWorkflow);
}

export async function getWorkflowById(id: string): Promise<WorkflowRecord | null> {
  const { dbOrgId } = await getAuthContext();

  const workflow = await db.workflow.findFirst({
    where: { id, organizationId: dbOrgId },
    include: { history: { orderBy: [{ version: 'desc' }, { createdAt: 'asc' }] } },
  });

  return workflow ? parseWorkflow(workflow) : null;
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
}): Promise<WorkflowRecord> {
  const { dbOrgId, userId } = await getAuthContext();

  // Enforce plan quota limit
  const { checkWorkflowLimit } = await import('@/services/usage');
  await checkWorkflowLimit(dbOrgId);

  const webhookSecret = randomBytes(32).toString('hex');

  const workflow = await db.$transaction(async (tx) => {
    const wf = await tx.workflow.create({
      data: {
        organizationId: dbOrgId,
        name: data.name,
        description: data.description ?? '',
        status: 'DRAFT',
        steps: [],
        version: 1,
        webhookSecret,
      },
      include: { history: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: 'workflow.create',
        resourceType: 'workflow',
        resourceId: wf.id,
        metadata: { name: data.name },
      },
    });

    return wf;
  });

  return parseWorkflow(workflow);
}

export async function updateWorkflow(
  id: string,
  updates: {
    name?: string;
    description?: string;
    status?: WorkflowStatus;
    steps?: WorkflowStepData[];
    nodes?: Node[];
    edges?: Edge[];
  }
): Promise<WorkflowRecord | null> {
  const { dbOrgId, userId } = await getAuthContext();

  const workflowId = await withSerializableRetry(async () => db.$transaction(async (tx) => {
    const existing = await tx.workflow.findFirst({
      where: { id, organizationId: dbOrgId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        steps: true,
        nodes: true,
        edges: true,
        version: true,
        organization: { select: { plan: true } },
      },
    });
    if (!existing) return null;

    const graphChanged = updates.steps !== undefined && !workflowGraphsEqual(existing.steps, updates.steps);
    const changedFields = getChangedFields(existing, updates, graphChanged);
    const nextSteps = (updates.steps ?? existing.steps) as WorkflowStepData[];
    if (updates.steps !== undefined || updates.status === 'PUBLISHED') {
      assertStepLimit(existing.organization.plan as PlanName, nextSteps.length);
    }
    if (changedFields.length === 0) {
      return existing.id;
    }

    if (graphChanged) {
      const snapshots = await tx.workflowVersion.findMany({
        where: { workflowId: id, version: existing.version },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (snapshots.length === 0) {
        await tx.workflowVersion.create({
          data: {
            workflowId: id,
            version: existing.version,
            steps: JSON.parse(JSON.stringify(existing.steps)),
          },
        });
      } else if (snapshots.length > 1) {
        await tx.workflowVersion.deleteMany({
          where: { id: { in: snapshots.slice(1).map((snapshot) => snapshot.id) } },
        });
      }
    }

    const newVersion = graphChanged ? existing.version + 1 : existing.version;
    await tx.workflow.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.steps !== undefined && { steps: JSON.parse(JSON.stringify(updates.steps)) }),
        ...(updates.nodes !== undefined && { nodes: JSON.parse(JSON.stringify(updates.nodes)) }),
        ...(updates.edges !== undefined && { edges: JSON.parse(JSON.stringify(updates.edges)) }),
        version: newVersion,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: graphChanged ? 'workflow.version.create' : 'workflow.update',
        resourceType: 'workflow',
        resourceId: id,
        metadata: { version: newVersion, changes: changedFields },
      },
    });

    return id;
  }, workflowTransactionOptions));

  if (!workflowId) return null;

  const workflow = await db.workflow.findUnique({
    where: { id: workflowId },
    include: { history: { orderBy: [{ version: 'desc' }, { createdAt: 'asc' }] } },
  });

  return workflow ? parseWorkflow(workflow) : null;
}

export async function duplicateWorkflow(id: string): Promise<WorkflowRecord> {
  const { dbOrgId, userId } = await getAuthContext();

  // Enforce plan quota limit
  const { checkWorkflowLimit } = await import('@/services/usage');
  await checkWorkflowLimit(dbOrgId);

  const original = await db.workflow.findFirst({
    where: { id, organizationId: dbOrgId },
  });
  if (!original) throw new Error('Workflow not found');
  const org = await db.organization.findUnique({ where: { id: dbOrgId }, select: { plan: true } });
  if (!org) throw new Error('Organization not found');
  assertStepLimit(org.plan as PlanName, (original.steps as WorkflowStepData[]).length);

  const webhookSecret = randomBytes(32).toString('hex');

  const workflow = await db.$transaction(async (tx) => {
    const wf = await tx.workflow.create({
      data: {
        organizationId: dbOrgId,
        name: `Copy of ${original.name}`,
        description: original.description,
        status: 'DRAFT',
        steps: original.steps as any,
        nodes: original.nodes as any,
        edges: original.edges as any,
        version: 1,
        webhookSecret,
      },
      include: { history: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: 'workflow.duplicate',
        resourceType: 'workflow',
        resourceId: wf.id,
        metadata: { sourceWorkflowId: id },
      },
    });

    return wf;
  });

  return parseWorkflow(workflow);
}

export async function deleteWorkflow(id: string): Promise<{ success: boolean }> {
  const { dbOrgId, userId } = await requireRole('ADMIN');

  const existing = await db.workflow.findFirst({ where: { id, organizationId: dbOrgId } });
  if (!existing) return { success: false };

  await db.$transaction(async (tx) => {
    await tx.workflow.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: 'workflow.delete',
        resourceType: 'workflow',
        resourceId: id,
        metadata: { name: existing.name },
      },
    });
  });

  return { success: true };
}

export async function getWorkflowVersions(workflowId: string): Promise<WorkflowVersionRecord[]> {
  const { dbOrgId } = await getAuthContext();

  // Verify ownership
  const workflow = await db.workflow.findFirst({ where: { id: workflowId, organizationId: dbOrgId } });
  if (!workflow) throw new Error('Workflow not found');

  const versions = await db.workflowVersion.findMany({
    where: { workflowId },
    orderBy: [{ version: 'desc' }, { createdAt: 'asc' }],
  });

  return dedupeVersionsByNumber(versions).map((v) => ({
    ...v,
    date: v.createdAt,
    steps: v.steps as WorkflowStepData[],
  }));
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseWorkflow(wf: any): WorkflowRecord {
  return {
    ...wf,
    steps: (wf.steps as WorkflowStepData[]) ?? [],
    nodes: wf.nodes as Node[] | null,
    edges: wf.edges as Edge[] | null,
    history: dedupeVersionsByNumber(wf.history ?? []).map((h: any) => ({
      ...h,
      date: h.createdAt,
      steps: h.steps as WorkflowStepData[],
    })),
  };
}

function getChangedFields(
  existing: { name: string; description: string | null; status: WorkflowStatus; nodes: unknown; edges: unknown },
  updates: {
    name?: string;
    description?: string;
    status?: WorkflowStatus;
    steps?: WorkflowStepData[];
    nodes?: Node[];
    edges?: Edge[];
  },
  graphChanged: boolean
): string[] {
  const changed: string[] = [];
  if (updates.name !== undefined && updates.name !== existing.name) changed.push('name');
  if (updates.description !== undefined && updates.description !== existing.description) changed.push('description');
  if (updates.status !== undefined && updates.status !== existing.status) changed.push('status');
  if (graphChanged) changed.push('steps');
  if (updates.nodes !== undefined && JSON.stringify(updates.nodes) !== JSON.stringify(existing.nodes)) changed.push('nodes');
  if (updates.edges !== undefined && JSON.stringify(updates.edges) !== JSON.stringify(existing.edges)) changed.push('edges');
  return changed;
}

async function withSerializableRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const code = error && typeof error === 'object' ? (error as { code?: string }).code : undefined;
      if (code !== 'P2034' || attempt === 2) throw error;
    }
  }
  throw new Error('Workflow update could not be completed.');
}
