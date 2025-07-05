
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
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
  GitMerge,
} from 'lucide-react';
import * as icons from 'lucide-react';

import { Logo } from './icons';
import { WorkflowCanvas } from './workflow-canvas';
import { MonitoringPanel } from './monitoring-panel';
import { AIFunctionGenerator } from './ai-function-generator';
import { EditTriggerDialog } from './edit-trigger-dialog';
import { EditApiRequestDialog } from './edit-api-request-dialog';
import type { Workflow as WorkflowType, WorkflowStepData, IconName } from '@/lib/types';
import { updateWorkflow } from '@/lib/db';

const iconMap: Record<IconName, React.ElementType> = {
  Webhook: icons.Webhook,
  Mail: icons.Mail,
  FlaskConical: icons.FlaskConical,
  Database: icons.Database,
  ArrowRightLeft: icons.ArrowRightLeft,
  GitMerge: icons.GitMerge,
  Clock: icons.Clock,
  ShoppingCart: icons.ShoppingCart,
};

export function DashboardLayout({ workflow }: { workflow: WorkflowType }) {
  const [steps, setSteps] = React.useState<WorkflowStepData[]>(workflow.steps);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = React.useState(false);
  const [editingStep, setEditingStep] = React.useState<WorkflowStepData | null>(null);

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
      newStep.data = { webhookUrl: `https://api.sabagapulse.com/v1/webhooks/wf_${Date.now()}`};
    }

    if (newStep.type === 'action' && newStep.title === 'API Request') {
        newStep.data = {
          method: 'GET',
          apiUrl: 'https://api.example.com/data',
          auth: { type: 'none' },
          headers: [],
          body: ''
        };
    }

    handleSetSteps(prev => {
      if (newStep.type === 'trigger') {
        const newSteps = [...prev];
        const triggerIndex = newSteps.findIndex(s => s.type === 'trigger');
        if (triggerIndex !== -1) {
          newSteps[triggerIndex] = newStep;
        } else {
          newSteps.unshift(newStep);
        }
        return newSteps;
      } else {
        return [...prev, newStep];
      }
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
    setEditingStep(null);
  }

  const actionSteps = [
    { type: 'action' as const, icon: 'ArrowRightLeft' as const, title: 'API Request', description: 'Make an HTTP request' },
    { type: 'action' as const, icon: 'Mail' as const, title: 'Send Email', description: 'Send an email' },
    { type: 'action' as const, icon: 'Database' as const, title: 'Database Query', description: 'Interact with a database' },
    { type: 'action' as const, icon: 'GitMerge' as const, title: 'Condition', description: 'If/Else, Switch logic' },
  ];

  const triggerSteps = [
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify Event', description: 'Trigger on a Shopify event' },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
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
                    <SidebarMenuButton
                      onClick={() => handleAddStep(trigger)}
                      tooltip={trigger.description}
                    >
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
                <SidebarMenuButton
                  onClick={() => setIsAiGeneratorOpen(true)}
                  tooltip="Generate function from text"
                >
                  <FlaskConical />
                  <span>Custom AI Function</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               {actionSteps.map((action) => {
                const ActionIcon = iconMap[action.icon];
                return (
                  <SidebarMenuItem key={action.title}>
                    <SidebarMenuButton
                      onClick={() => handleAddStep(action)}
                      tooltip={action.description}
                    >
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
              <SidebarMenuButton tooltip="Application settings">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Help and documentation">
                <HelpCircle />
                <span>Help</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 p-4 md:p-6">
          <Tabs defaultValue="designer" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="designer">Designer</TabsTrigger>
              <TabsTrigger value="logs">Monitoring & Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="designer">
              <WorkflowCanvas 
                steps={steps}
                setSteps={handleSetSteps}
                onCreateNewWorkflow={handleCreateNewWorkflow}
                onEditStep={setEditingStep}
                workflowName={workflow.name}
                workflowDescription={workflow.description}
              />
            </TabsContent>
            <TabsContent value="logs">
              <MonitoringPanel />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
      <AIFunctionGenerator
        open={isAiGeneratorOpen}
        onOpenChange={setIsAiGeneratorOpen}
        onFunctionGenerated={handleFunctionGenerated}
      />
      {editingStep && editingStep.type === 'trigger' && (
        <EditTriggerDialog
          step={editingStep}
          open={!!editingStep}
          onOpenChange={(isOpen) => !isOpen && setEditingStep(null)}
        />
      )}
      {editingStep && editingStep.title === 'API Request' && (
        <EditApiRequestDialog
            step={editingStep}
            open={!!editingStep}
            onOpenChange={(isOpen) => !isOpen && setEditingStep(null)}
            onSave={handleSaveAction}
        />
      )}
    </SidebarProvider>
  );
}
