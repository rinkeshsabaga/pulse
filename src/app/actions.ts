
'use server';

import { updateWorkflow } from '@/lib/db';
import type { Workflow as WorkflowType, WorkflowStepData } from '@/lib/types';

// In a real app, you would get the organizationId from the user's session
const aHardcodedOrganizationId = 'org_default_123';

export async function handleUpdate(workflowId: string, updatedWorkflow: Partial<WorkflowType>) {
    const result = await updateWorkflow(workflowId, updatedWorkflow, aHardcodedOrganizationId);
    return result;
}

export async function handleRevert(workflowId: string, steps: WorkflowStepData[]) {
    return await handleUpdate(workflowId, { steps });
}
