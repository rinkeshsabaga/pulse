
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { AIFunctionGenerator } from './ai-function-generator';
import { EditTriggerDialog } from './edit-trigger-dialog';
import { EditShopifyTriggerDialog } from './edit-shopify-trigger-dialog';
import { EditApiRequestDialog } from './edit-api-request-dialog';
import { EditCustomCodeDialog } from './edit-custom-code-dialog';
import { EditWaitDialog } from './edit-wait-dialog';
import { EditAppTriggerDialog } from './edit-app-trigger-dialog';
import { EditAppActionDialog } from './edit-app-action-dialog';
import { EditConditionDialog } from './edit-condition-dialog';
import { EditCronJobDialog } from './edit-cron-job-dialog';
import { EditSendEmailDialog } from './edit-send-email-dialog';
import { EditDatabaseQueryDialog } from './edit-database-query-dialog';
import type { Workflow as WorkflowType, WorkflowStepData, IconName } from '@/lib/types';
import { updateWorkflow } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { DashboardLayout } from './dashboard-layout';
import { WorkflowCanvas } from './workflow-canvas';
import { generateOutputContext } from '@/lib/flow-utils';

export function WorkflowCanvasWrapper({ workflow }: { workflow: WorkflowType }) {
  const [steps, setSteps] = useState<WorkflowStepData[]>(workflow.steps);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [editingStepInfo, setEditingStepInfo] = useState<{ step: WorkflowStepData, dataContext: any } | null>(null);

  useEffect(() => {
    setSteps(workflow.steps);
  }, [workflow]);

  const persistSteps = (newSteps: WorkflowStepData[]) => {
    updateWorkflow(workflow.id, { steps: newSteps });
  };
  
  const handleSetSteps = useCallback((newStepsOrFn: React.SetStateAction<WorkflowStepData[]>) => {
    const newSteps = typeof newStepsOrFn === 'function' ? newStepsOrFn(steps) : newStepsOrFn;
    setSteps(newSteps);
    persistSteps(newSteps);
  }, [steps]);

  const handleEditStep = useCallback((stepToEdit: WorkflowStepData, edges: any) => {
    const parentEdges = edges.filter((e: any) => e.target === stepToEdit.id);
    const parentNodeIds = parentEdges.map((e: any) => e.source);
    
    const dataContext = generateOutputContext(steps, parentNodeIds);

    setEditingStepInfo({ step: stepToEdit, dataContext });
  }, [steps]);

  const handleAddStep = (step: { type: 'trigger' | 'action', icon: IconName; title: string, description: string }) => {
    const newStep: WorkflowStepData = {
      id: `step-${uuidv4()}`,
      ...step,
      status: 'default'
    };
    
    if (newStep.type === 'trigger' && newStep.title === 'Webhook') {
      newStep.data = { webhookUrl: `https://api.sabagapulse.com/v1/webhooks/wf_${Date.now()}`, events: [], selectedEventId: null };
    }
    if (newStep.type === 'trigger' && newStep.title === 'Shopify') {
        newStep.description = 'Click Edit to select an event';
        newStep.data = { shopifyEvent: 'order_placed' };
    }
    if (newStep.type === 'trigger' && newStep.title === 'App Event') {
        newStep.description = 'Click Edit to select an app';
        newStep.data = { appTrigger: { app: '', event: '' } };
    }
    if (newStep.type === 'trigger' && newStep.title === 'Cron Job') {
        newStep.description = 'Every minute';
        newStep.data = { scheduleMode: 'cron', cronString: '* * * * *' };
    }
    if (newStep.type === 'action' && newStep.title === 'App Action') {
        newStep.description = 'Click Edit to select an app';
        newStep.data = { appAction: { app: '', action: '' } };
    }
    if (newStep.type === 'action' && newStep.title === 'API Request') {
        newStep.data = { method: 'GET', apiUrl: 'https://api.example.com/data', auth: { type: 'none' }, headers: [], body: { type: 'none', content: '' } };
    }
    if (newStep.type === 'action' && newStep.title === 'Database Query') {
        newStep.description = 'Click Edit to write a query';
        newStep.data = { databaseQueryData: { credentialId: '', query: 'SELECT * FROM users LIMIT 10;' } };
    }
    if (newStep.title === 'Custom Code' || newStep.title === 'Custom AI Function') {
        newStep.description = 'Click Edit to write code';
        newStep.content = { code: '// Your code here', language: 'typescript' };
        if(newStep.title === 'Custom AI Function') setIsAiGeneratorOpen(true);
    }
    if (newStep.title === 'Wait') {
        newStep.description = 'For 5 minutes';
        newStep.data = { waitMode: 'duration', waitDurationValue: 5, waitDurationUnit: 'minutes' };
    }
     if (newStep.title === 'Send Email') {
        newStep.description = 'Click Edit to compose email';
        newStep.data = { emailData: { to: '', from: 'noreply@sabagapulse.com', subject: '', body: '' } };
    }
     if (newStep.title === 'Condition') {
        newStep.description = 'Click Edit to set conditions';
        newStep.data = { conditionData: { cases: [{ id: uuidv4(), name: 'Case 1', logicalOperator: 'AND', rules: [{ id: uuidv4(), variable: '', operator: 'equals', value: '' }] }] } };
    }

    handleSetSteps(prev => [...prev, newStep]);
  };

  const handleFunctionGenerated = (code: string, language: string, intent: string) => {
    const newStep = {
        id: `step-${uuidv4()}`,
        type: 'action' as const,
        icon: 'FlaskConical' as const,
        title: 'Custom AI Function',
        description: intent.length > 50 ? intent.substring(0, 47) + '...' : intent,
        content: { code, language },
        status: 'default' as const
    };
    handleSetSteps(prev => [...prev, newStep]);
  };

  const handleSaveAction = (updatedStep: WorkflowStepData) => {
    handleSetSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
    setEditingStepInfo(null);
  }

  return (
    <>
      <DashboardLayout onAddStep={handleAddStep}>
        <div className="relative flex-1 bg-background h-full">
            <WorkflowCanvas 
                steps={steps}
                setSteps={handleSetSteps}
                onEditStep={handleEditStep}
                workflowName={workflow.name}
                workflowDescription={workflow.description}
            />
        </div>
      </DashboardLayout>
        
        <AIFunctionGenerator
            open={isAiGeneratorOpen}
            onOpenChange={setIsAiGeneratorOpen}
            onFunctionGenerated={handleFunctionGenerated}
        />
        {editingStepInfo && editingStepInfo.step.title === 'Webhook' && (
            <EditTriggerDialog
            step={editingStepInfo.step}
            workflowId={workflow.id}
            open={!!editingStepInfo}
            onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
            onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'Cron Job' && (
            <EditCronJobDialog
                step={editingStepInfo.step}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'Shopify' && (
            <EditShopifyTriggerDialog
                step={editingStepInfo.step}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'App Event' && (
            <EditAppTriggerDialog
                step={editingStepInfo.step}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'App Action' && (
            <EditAppActionDialog
                step={editingStepInfo.step}
                dataContext={editingStepInfo.dataContext}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'API Request' && (
            <EditApiRequestDialog
                step={editingStepInfo.step}
                dataContext={editingStepInfo.dataContext}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'Database Query' && (
            <EditDatabaseQueryDialog
                step={editingStepInfo.step}
                dataContext={editingStepInfo.dataContext}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        {editingStepInfo && editingStepInfo.step.title === 'Send Email' && (
            <EditSendEmailDialog
                step={editingStepInfo.step}
                dataContext={editingStepInfo.dataContext}
                open={!!editingStepInfo}
                onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
                onSave={handleSaveAction}
            />
        )}
        <EditCustomCodeDialog
            step={editingStepInfo?.step}
            dataContext={editingStepInfo?.dataContext}
            open={!!editingStepInfo && (editingStepInfo.step.title === 'Custom Code' || editingStepInfo.step.title === 'Custom AI Function')}
            onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
            onSave={handleSaveAction}
        />
        <EditWaitDialog
            step={editingStepInfo?.step}
            dataContext={editingStepInfo?.dataContext}
            open={!!editingStepInfo && editingStepInfo.step.title === 'Wait'}
            onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
            onSave={handleSaveAction}
        />
        <EditConditionDialog
            step={editingStepInfo?.step}
            dataContext={editingStepInfo?.dataContext}
            open={!!editingStepInfo && editingStepInfo.step.title === 'Condition'}
            onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
            onSave={handleSaveAction}
        />
    </>
  );
}
