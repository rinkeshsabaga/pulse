
import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Workflow } from '@/lib/types';

export default async function WorkflowEditorPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }
  
  return <DashboardLayout workflow={workflow} />;
}
