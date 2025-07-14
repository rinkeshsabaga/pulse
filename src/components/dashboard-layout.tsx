

'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

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
import type { Workflow as WorkflowType, WorkflowStepData, IconName } from '@/lib/types';
import { updateWorkflow } from '@/lib/db';
import * as icons from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const Triggers = [
    { type: 'trigger' as const, icon: 'AppWindow' as const, title: 'App Event', description: 'Trigger from an app' },
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify', description: 'Trigger on a Shopify event' },
];

const Actions = [
    { type: 'action' as const, icon: 'AppWindow' as const, title: 'App Action', description: 'Perform an action in an app' },
    { type: 'action' as const, icon: 'GitBranch' as const, title: 'Condition', description: 'Branch workflow on conditions' },
    { type: 'action' as const, icon: 'Clock' as const, title: 'Wait', description: 'Delay workflow execution' },
    { type: 'action' as const, icon: 'Code' as const, title: 'Custom Code', description: 'Write and run custom code' },
    { type: 'action' as const, icon: 'FlaskConical' as const, title: 'Custom AI Function', description: 'Generate code with AI' },
    { type: 'action' as const, icon: 'ArrowRightLeft' as const, title: 'API Request', description: 'Make an HTTP request' },
    { type: 'action' as const, icon: 'Mail' as const, title: 'Send Email', description: 'Send an email' },
    { type: 'action' as const, icon: 'Database' as const, title: 'Database Query', description: 'Interact with a database' },
    { type: 'action' as const, icon: 'StopCircle' as const, title: 'End Automation', description: 'Stops the workflow execution' },
];

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

  const handleAddStep = (step: { type: 'trigger' | 'action', icon: IconName; title: string, description: string }) => {
    const newStep: WorkflowStepData = {
      id: `step-${uuidv4()}`,
      ...step,
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
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] xl:grid-cols-[400px_1fr] h-full">
      <Sheet defaultOpen>
        <SheetContent side="left" className="p-0 border-r" hideCloseButton>
            <SheetHeader className="sr-only">
              <SheetTitle>Workflow Tools</SheetTitle>
              <SheetDescription>Select tools and view logs for the current workflow.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col p-4 md:p-6">
                <Tabs defaultValue="designer" className="flex h-full w-full flex-col">
                <TabsList className="mb-4">
                    <TabsTrigger value="designer">Designer</TabsTrigger>
                    <TabsTrigger value="logs">Monitoring & Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="designer" className="flex-1">
                    <Accordion type="single" collapsible defaultValue="actions" className="w-full">
                        <AccordionItem value="triggers">
                            <AccordionTrigger>Triggers</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 gap-2">
                                {Triggers.map((tool) => {
                                    const Icon = iconMap[tool.icon];
                                    return (
                                    <Card key={tool.title} onClick={() => handleAddStep(tool)} className="cursor-pointer hover:bg-muted/50">
                                        <CardContent className="p-3 flex items-start gap-4">
                                            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                                            <div>
                                                <h3 className="font-semibold">{tool.title}</h3>
                                                <p className="text-sm text-muted-foreground">{tool.description}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    );
                                })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="actions">
                            <AccordionTrigger>Actions</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 gap-2">
                                    {Actions.map((tool) => {
                                    const Icon = iconMap[tool.icon];
                                    return (
                                        <Card key={tool.title} onClick={() => handleAddStep(tool)} className="cursor-pointer hover:bg-muted/50">
                                            <CardContent className="p-3 flex items-start gap-4">
                                                <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                                                <div>
                                                    <h3 className="font-semibold">{tool.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>
                <TabsContent value="logs" className="flex-1">
                    <MonitoringPanel />
                </TabsContent>
                </Tabs>
            </div>
        </SheetContent>
      </Sheet>
        <div className="relative flex-1 bg-background h-full">
            <WorkflowCanvas 
                steps={steps}
                setSteps={handleSetSteps}
                onEditStep={(step, dataContext) => setEditingStepInfo({ step, dataContext })}
                workflowName={workflow.name}
                workflowDescription={workflow.description}
            />
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
