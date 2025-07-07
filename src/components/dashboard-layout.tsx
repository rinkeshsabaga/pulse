

'use client';

import React from 'react';
import {
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Mail,
  Settings,
  HelpCircle,
  FlaskConical,
  Database,
  ArrowRightLeft,
  Clock,
  Webhook,
  ShoppingCart,
  StopCircle,
  Code,
  AppWindow,
  GitBranch,
} from 'lucide-react';
import * as icons from 'lucide-react';

import { Logo } from './icons';
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
import type { Workflow as WorkflowType, WorkflowStepData, IconName, Case } from '@/lib/types';
import { updateWorkflow } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const iconMap: Record<IconName, React.ElementType> = {
  Webhook: icons.Webhook,
  Mail: icons.Mail,
  FlaskConical: icons.FlaskConical,
  Database: icons.Database,
  ArrowRightLeft: icons.ArrowRightLeft,
  GitBranch: icons.GitBranch,
  Clock: icons.Clock,
  ShoppingCart: icons.ShoppingCart,
  StopCircle: icons.StopCircle,
  Code: icons.Code,
  AppWindow: icons.AppWindow,
};

export function DashboardLayout({ workflow }: { workflow: WorkflowType }) {
  const [steps, setSteps] = React.useState<WorkflowStepData[]>(workflow.steps);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = React.useState(false);
  const [editingStepInfo, setEditingStepInfo] = React.useState<{ step: WorkflowStepData, dataContext: any } | null>(null);


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

  const handleAddStep = (step: Omit<WorkflowStepData, 'id' | 'status' | 'content' | 'errorMessage' | 'data'>) => {
    const newStep: WorkflowStepData = {
      id: `step-${Date.now()}`,
      ...step,
      status: 'default'
    };
    
    if (newStep.type === 'trigger' && newStep.title === 'Webhook') {
      newStep.data = { 
        webhookUrl: `https://api.sabagapulse.com/v1/webhooks/wf_${Date.now()}`,
        events: [],
        selectedEventId: null
      };
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
        newStep.data = {
            scheduleMode: 'cron',
            cronString: '* * * * *'
        };
    }

    if (newStep.type === 'action' && newStep.title === 'App Action') {
        newStep.description = 'Click Edit to select an app';
        newStep.data = { appAction: { app: '', action: '' } };
    }

    if (newStep.type === 'action' && newStep.title === 'API Request') {
        newStep.data = {
          method: 'GET',
          apiUrl: 'https://api.example.com/data',
          auth: { type: 'none' },
          headers: [],
          body: { type: 'none', content: '' }
        };
    }
    
    if (newStep.title === 'Custom Code') {
        newStep.description = 'Click Edit to write code';
        newStep.content = { code: '// Your code here', language: 'typescript' };
    }

    if (newStep.title === 'Wait') {
        newStep.description = 'For 5 minutes';
        newStep.data = {
            waitMode: 'duration',
            waitDurationValue: 5,
            waitDurationUnit: 'minutes'
        };
    }

    if (newStep.title === 'Condition') {
        newStep.description = 'Click Edit to set conditions';
        newStep.data = {
            conditionData: {
                cases: [{ id: uuidv4(), name: 'Case 1', logicalOperator: 'AND', rules: [{ id: uuidv4(), variable: '', operator: 'equals', value: '' }] }]
            }
        };
    }

    handleSetSteps(prev => {
      if (newStep.type === 'trigger' && newStep.title !== 'Shopify' && newStep.title !== 'Webhook' && newStep.title !== 'Cron Job' && newStep.title !== 'App Event') {
         // This logic handles replacing existing triggers, but Shopify can have multiple.
         // For now, let's simplify and just add it. Re-evaluation needed for multiple triggers.
      }
      
      const triggerIndex = prev.findIndex(s => s.type === 'trigger');
      if (newStep.type === 'trigger' && triggerIndex !== -1 && newStep.title === 'Webhook') {
          // Replace existing non-shopify trigger
          const newSteps = [...prev];
          newSteps[triggerIndex] = newStep;
          return newSteps;
      }

      return [...prev, newStep];
    });
  };

  const handleFunctionGenerated = (code: string, language: string, intent: string) => {
    const newStep: WorkflowStepData = {
        id: `step-${Date.now()}`,
        type: 'action',
        icon: 'FlaskConical',
        title: 'Custom AI Function',
        description: intent.length > 50 ? intent.substring(0, 47) + '...' : intent,
        content: {
            code,
            language
        },
        status: 'default'
    }
    handleSetSteps(prevSteps => [...prevSteps, newStep]);
  };

  const handleCreateNewWorkflow = () => {
    handleSetSteps([]);
  };

  const handleSaveAction = (updatedStep: WorkflowStepData) => {
    handleSetSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
    setEditingStepInfo(null);
  }

  const actionSteps = [
    { type: 'action' as const, icon: 'AppWindow' as const, title: 'App Action', description: 'Perform an action in an app' },
    { type: 'action' as const, icon: 'GitBranch' as const, title: 'Condition', description: 'Branch workflow on conditions' },
    { type: 'action' as const, icon: 'Clock' as const, title: 'Wait', description: 'Delay workflow execution' },
    { type: 'action' as const, icon: 'Code' as const, title: 'Custom Code', description: 'Write and run custom code' },
    { type: 'action' as const, icon: 'ArrowRightLeft' as const, title: 'API Request', description: 'Make an HTTP request' },
    { type: 'action' as const, icon: 'Mail' as const, title: 'Send Email', description: 'Send an email' },
    { type: 'action' as const, icon: 'Database' as const, title: 'Database Query', description: 'Interact with a database' },
    { type: 'action' as const, icon: 'StopCircle' as const, title: 'End Automation', description: 'Stops the workflow execution' },
  ];

  const triggerSteps = [
    { type: 'trigger' as const, icon: 'AppWindow' as const, title: 'App Event', description: 'Trigger from an app' },
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify', description: 'Trigger on a Shopify event' },
  ];

  return (
    <SidebarProvider>
      <div className="flex flex-row flex-1 w-full h-full">
        <div className="w-64 flex-shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-primary" />
              <span className="text-lg font-semibold font-headline text-primary">
                Tools
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Triggers</SidebarGroupLabel>
              <SidebarMenu>
                {triggerSteps.map((trigger) => {
                  const TriggerIcon = iconMap[trigger.icon];
                  return (
                    <SidebarMenuItem key={trigger.title}>
                      <SidebarMenuButton onClick={() => handleAddStep(trigger)}>
                        <TriggerIcon />
                        <span>{trigger.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Actions</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setIsAiGeneratorOpen(true)}>
                    <FlaskConical />
                    <span>Custom AI Function</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {actionSteps.map((action) => {
                  const ActionIcon = iconMap[action.icon];
                  return (
                    <SidebarMenuItem key={action.title}>
                      <SidebarMenuButton onClick={() => handleAddStep(action)}>
                        <ActionIcon />
                        <span>{action.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <HelpCircle />
                  <span>Help</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </div>
        <div className="flex-1 flex flex-col">
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
                  onCreateNewWorkflow={handleCreateNewWorkflow}
                  onEditStep={(step, dataContext) => setEditingStepInfo({ step, dataContext })}
                  workflowName={workflow.name}
                  workflowDescription={workflow.description}
                />
              </TabsContent>
              <TabsContent value="logs" className="flex-1">
                <MonitoringPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
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
      <EditCustomCodeDialog
        step={editingStepInfo?.step}
        open={!!editingStepInfo && (editingStepInfo.step.title === 'Custom Code' || editingStepInfo.step.title === 'Custom AI Function')}
        onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
        onSave={handleSaveAction}
      />
      <EditWaitDialog
        step={editingStepInfo?.step}
        open={!!editingStepInfo && editingStepInfo.step.title === 'Wait'}
        onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
        onSave={handleSaveAction}
      />
      <EditConditionDialog
        step={editingStepInfo?.step}
        open={!!editingStepInfo && editingStepInfo.step.title === 'Condition'}
        onOpenChange={(isOpen) => !isOpen && setEditingStepInfo(null)}
        onSave={handleSaveAction}
      />
    </SidebarProvider>
  );
}
