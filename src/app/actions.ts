'use server';

import { getAuthContext } from '@/lib/auth';
import { updateWorkflow, getWorkflowById } from '@/services/workflows';
import { inngest } from '@/inngest/client';
import { checkWorkflowRunEntitlement } from '@/services/usage';
import type { WorkflowStepData } from '@/lib/types';
import { validateWorkflow, type WorkflowValidationIssue } from '@/lib/workflow-graph';

// ─────────────────────────────────────────────────────────────────────────────
// Server Actions — Called from Client Components
// All org context is now read from the user's authenticated session.
// ─────────────────────────────────────────────────────────────────────────────

export async function handleUpdate(
  workflowId: string,
  updatedData: {
    name?: string;
    description?: string;
    steps?: WorkflowStepData[];
    nodes?: any[];
    edges?: any[];
  }
) {
  return updateWorkflow(workflowId, updatedData);
}

export async function handleRevert(workflowId: string, steps: WorkflowStepData[]) {
  return updateWorkflow(workflowId, { steps });
}

/**
 * Triggers a manual workflow run via Inngest.
 */
export async function handleRunWorkflow(workflowId: string) {
  const { dbOrgId } = await getAuthContext();

  // Verify workflow exists and belongs to this org
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');
  if (workflow.status !== 'PUBLISHED') {
    throw new Error('Only published workflows can be run. Publish your workflow first.');
  }
  const validation = validateWorkflow(workflow.steps);
  if (!validation.valid) {
    throw new Error(`Workflow is invalid: ${validation.issues.map((issue) => issue.message).join(' ')}`);
  }

  await checkWorkflowRunEntitlement(dbOrgId, workflow.steps);

  // Fire Inngest event
  const { ids } = await inngest.send({
    name: 'workflow/run',
    data: {
      workflowId,
      organizationId: dbOrgId,
      trigger: 'manual',
      triggerData: { triggeredAt: new Date().toISOString() },
    },
  });

  return { success: true, inngestRunId: ids[0] };
}

/**
 * Publishes a workflow (sets status to PUBLISHED).
 */
export async function handlePublishWorkflow(workflowId: string) {
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    return statusChangeFailure([{ code: 'EMPTY_WORKFLOW', message: 'Workflow not found.' }]);
  }

  const validation = validateWorkflow(workflow.steps);
  if (!validation.valid) {
    return statusChangeFailure(validation.issues);
  }

  return {
    success: true as const,
    workflow: await updateWorkflow(workflowId, { status: 'PUBLISHED' }),
    errors: [] as WorkflowValidationIssue[],
  };
}

/**
 * Unpublishes a workflow (sets status to DRAFT).
 */
export async function handleUnpublishWorkflow(workflowId: string) {
  return {
    success: true as const,
    workflow: await updateWorkflow(workflowId, { status: 'DRAFT' }),
    errors: [] as WorkflowValidationIssue[],
  };
}

function statusChangeFailure(errors: WorkflowValidationIssue[]) {
  return {
    success: false as const,
    workflow: null,
    errors,
  };
}
