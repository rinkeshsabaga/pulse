
import React from 'react';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { WorkflowCanvasWrapper } from '@/components/workflow-canvas-wrapper';
import { updateWorkflow } from '@/lib/db';
import type { Workflow as WorkflowType, WorkflowStepData } from '@/lib/types';

async function handleUpdate(workflowId: string, updatedWorkflow: Partial<WorkflowType>) {
    'use server';
    const result = await updateWorkflow(workflowId, updatedWorkflow);
    return result;
}

async function handleRevert(workflowId: string, steps: WorkflowStepData[]) {
    'use server';
    return await handleUpdate(workflowId, { steps });
}

export default async function WorkflowEditorPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  let workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }
  
  return (
    <WorkflowCanvasWrapper 
        workflow={workflow} 
        onUpdate={(data) => handleUpdate(workflow.id, data)}
        onRevert={(steps) => handleRevert(workflow.id, steps)} 
    />
    );
}
