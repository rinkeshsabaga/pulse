
import React from 'react';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Workflow } from '@/lib/types';
import { WorkflowCanvasWrapper } from '@/components/workflow-canvas-wrapper';

export default async function WorkflowEditorPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }
  
  return <WorkflowCanvasWrapper workflow={workflow} />;
}
