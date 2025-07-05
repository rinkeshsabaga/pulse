
import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Workflow } from '@/lib/types';

export default async function WorkflowEditorPage({ params }: { params: { workflowId: string } }) {
  const workflow = await getWorkflowById(params.workflowId);

  if (!workflow) {
    notFound();
  }
  
  return <DashboardLayout workflow={workflow} />;
}
