
import React from 'react';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { WorkflowCanvasWrapper } from '@/components/workflow-canvas-wrapper';
import { updateWorkflow } from '@/lib/db';
import type { Workflow as WorkflowType } from '@/lib/types';


export default async function WorkflowEditorPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  const handleUpdate = async (updatedWorkflow: Partial<WorkflowType>) => {
    'use server';
    if (!workflow) return;
    await updateWorkflow(workflow.id, updatedWorkflow);
  };
  
  return <WorkflowCanvasWrapper workflow={workflow} onUpdate={handleUpdate} />;
}
