
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import type { Workflow } from '@/lib/types';
import { getWorkflowById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkflowEditorPage({ params }: { params: { workflowId: string } }) {
  const [workflow, setWorkflow] = useState<Workflow | null | undefined>(undefined);

  useEffect(() => {
    async function loadWorkflow() {
      const wf = await getWorkflowById(params.workflowId);
      setWorkflow(wf);
    }
    if (params.workflowId) {
      loadWorkflow();
    }
  }, [params.workflowId]);

  if (workflow === undefined) {
    return (
        <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (workflow === null) {
    notFound();
  }
  
  return <DashboardLayout workflow={workflow} />;
}
