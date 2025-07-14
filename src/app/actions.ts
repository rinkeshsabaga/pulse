
'use server';

import { updateWorkflow } from '@/lib/db';
import type { Workflow as WorkflowType, WorkflowStepData } from '@/lib/types';

export async function handleUpdate(workflowId: string, updatedWorkflow: Partial<WorkflowType>) {
    const result = await updateWorkflow(workflowId, updatedWorkflow);
    return result;
}

export async function handleRevert(workflowId: string, steps: WorkflowStepData[]) {
    return await handleUpdate(workflowId, { steps });
}
