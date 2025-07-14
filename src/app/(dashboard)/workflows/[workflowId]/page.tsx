
import React from 'react';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { WorkflowCanvasWrapper } from '@/components/workflow-canvas-wrapper';
import { updateWorkflow } from '@/lib/db';
import type { Workflow as WorkflowType, WorkflowStepData } from '@/lib/types';


export default async function WorkflowEditorPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  let workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  const handleUpdate = async (updatedWorkflow: Partial<WorkflowType>) => {
    'use server';
    if (!workflow) return;
    const result = await updateWorkflow(workflow.id, updatedWorkflow);
    // Re-assign to get the latest version info after update
    if (result) {
        workflow = result;
    }
    return result;
  };

  const handleRevert = async (steps: WorkflowStepData[]) => {
    'use server';
    if (!workflow) return;
    return await handleUpdate({ steps });
  }
  
  return <WorkflowCanvasWrapper workflow={workflow} onUpdate={handleUpdate} onRevert={handleRevert} />;
}
