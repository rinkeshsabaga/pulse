

'use client';

import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { WorkflowCanvas } from './workflow-canvas';
import { MonitoringPanel } from './monitoring-panel';
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
import type { Workflow as WorkflowType, WorkflowStepData } from '@/lib/types';
import { updateWorkflow } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { AddStepDialog, type StepDefinition } from './add-step-dialog';


export function DashboardLayout({ workflow }: { workflow: WorkflowType }) {
  const [steps, setSteps] = React.useState<WorkflowStepData[]>(workflow.steps);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = React.useState(false);
  const [editingStepInfo, setEditingStepInfo] = React.useState<{ step: WorkflowStepData, dataContext: any } | null>(null);

  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = React.useState(false);
  const [addStepAfterIndex, setAddStepAfterIndex] = React.useState(-1);


  React.useEffect(() => {
    setSteps(workflow.steps);
  }, [workflow]);

  const persistSteps = (newSteps: WorkflowStepData[]) => {
    updateWorkflow(workflow.id, { steps: newSteps });
  };
  
  const handleSetSteps = (newStepsOrFn: React.SetStateAction<WorkflowStepData[]>) => {
    const newSteps = typeof newStepsOrFn === 'function' ? newStepsOrFn(steps) : newStepsOrFn;
    setSteps(newSteps);
    persistSteps(newSteps);
  };

  const handleAddStep = (stepDef: StepDefinition) => {
    const newStep: WorkflowStepData = {
      id: `step-${uuidv4()}`,
      ...stepDef,
      status: 'default'
    };
    
    // --- Initialize default data for specific step types ---
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
    
    handleSetSteps(prev => {
      // If it's the first step, just add it.
      if(addStepAfterIndex === -1 && prev.length === 0) {
        return [newStep];
      }
      
      const newSteps = [...prev];
      newSteps.splice(addStepAfterIndex + 1, 0, newStep);
      return newSteps;
    });
  };

  const handleFunctionGenerated = (code: string, language: string, intent: string) => {
    const newStep: WorkflowStepData = {
        id: `step-${uuidv4()}`,
        type: 'action',
        icon: 'FlaskConical',
        title: 'Custom AI Function',
        description: intent.length > 50 ? intent.substring(0, 47) + '...' : intent,
        content: { code, language },
        status: 'default'
    }
    handleSetSteps(prev => {
        const newSteps = [...prev];
        newSteps.splice(addStepAfterIndex + 1, 0, newStep);
        return newSteps;
    });
  };

  const handleOpenAddStepDialog = (index: number) => {
    setAddStepAfterIndex(index);
    setIsAddStepDialogOpen(true);
  }

  const handleSaveAction = (updatedStep: WorkflowStepData) => {
    handleSetSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
    setEditingStepInfo(null);
  }

  return (
      <div className="flex-1 flex flex-col h-full">
          <div className="flex h-full flex-col p-4 md:p-6">
            <Tabs defaultValue="designer" className="flex h-full w-full flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="designer">Designer</TabsTrigger>
                <TabsTrigger value="logs">Monitoring & Logs</TabsTrigger>
              </TabsList>
              <TabsContent value="designer" className="flex-1">
                <WorkflowCanvas 
                  steps={steps}
                  setSteps={handleSetSteps}
                  onEditStep={(step, dataContext) => setEditingStepInfo({ step, dataContext })}
                  onAddStep={handleOpenAddStepDialog}
                  workflowName={workflow.name}
                  workflowDescription={workflow.description}
                />
              </TabsContent>
              <TabsContent value="logs" className="flex-1">
                <MonitoringPanel />
              </TabsContent>
            </Tabs>
          </div>
        
        <AddStepDialog 
            open={isAddStepDialogOpen}
            onOpenChange={setIsAddStepDialogOpen}
            onStepSelect={handleAddStep}
        />
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
      </div>
  );
}
