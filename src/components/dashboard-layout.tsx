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
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Code,
  Mail,
  Workflow,
  Settings,
  HelpCircle,
  FlaskConical,
  Database,
  ArrowRightLeft,
  Search,
  ChevronDown,
  Zap,
  Clock,
  Webhook,
  ShoppingCart,
  GitMerge,
} from 'lucide-react';

import { Logo } from './icons';
import { WorkflowCanvas } from './workflow-canvas';
import { MonitoringPanel } from './monitoring-panel';
import { AIFunctionGenerator } from './ai-function-generator';

export type WorkflowStepData = {
  id: string;
  type: 'trigger' | 'action';
  icon: React.ElementType;
  title: string;
  description: string;
  content?: {
    code: string;
    language: string;
  };
  errorMessage?: {
    title: string;
    description: string;
  };
  status?: 'success' | 'warning' | 'error' | 'default';
};

const initialSteps: WorkflowStepData[] = [
    {
      id: 'step-1',
      type: 'trigger',
      icon: Webhook,
      title: 'HTTP Request Recieved',
      description: 'via Webhook',
      status: 'success',
    },
    {
      id: 'step-2',
      type: 'action',
      icon: FlaskConical,
      title: 'Generate Welcome Email',
      description: 'AI-powered content generation',
      content: {
          code: 'function generateEmail(username) {\n  // ...\n}',
          language: 'typescript'
      },
      status: 'success',
    },
    {
      id: 'step-3',
      type: 'action',
      icon: Mail,
      title: 'Send Email',
      description: 'via SendGrid',
      status: 'error',
      errorMessage: {
        title: 'Error: SMTP connection failed',
        description: 'Could not connect to SendGrid API.'
      }
    },
];


export function DashboardLayout() {
  const [steps, setSteps] = React.useState<WorkflowStepData[]>(initialSteps);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = React.useState(false);

  const handleAddStep = (step: Omit<WorkflowStepData, 'id' | 'status' | 'content' | 'errorMessage'>) => {
    const newStep: WorkflowStepData = {
      id: `step-${Date.now()}`,
      ...step,
      status: 'default'
    };
    
    if (newStep.type === 'trigger') {
      setSteps(prev => {
        const newSteps = [...prev];
        const triggerIndex = newSteps.findIndex(s => s.type === 'trigger');
        if (triggerIndex !== -1) {
          newSteps[triggerIndex] = newStep;
        } else {
          newSteps.unshift(newStep);
        }
        return newSteps;
      });
    } else {
      setSteps(prev => [...prev, newStep]);
    }
  };

  const handleFunctionGenerated = (code: string, language: string, intent: string) => {
    const newStep: WorkflowStepData = {
        id: `step-${Date.now()}`,
        type: 'action',
        icon: FlaskConical,
        title: 'Custom AI Function',
        description: intent.length > 50 ? intent.substring(0, 47) + '...' : intent,
        content: {
            code,
            language
        },
        status: 'default'
    }
    setSteps(prevSteps => [...prevSteps, newStep]);
  };

  const handleCreateNewWorkflow = () => {
    setSteps([]);
  };

  const actionSteps = [
    { type: 'action' as const, icon: ArrowRightLeft, title: 'Data Transform', description: 'Transform data structure' },
    { type: 'action' as const, icon: Mail, title: 'Send Email', description: 'Send an email' },
    { type: 'action' as const, icon: Database, title: 'Database Query', description: 'Interact with a database' },
    { type: 'action' as const, icon: GitMerge, title: 'Condition', description: 'If/Else, Switch logic' },
  ];

  const triggerSteps = [
    { type: 'trigger' as const, icon: Webhook, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: Clock, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: ShoppingCart, title: 'Shopify Event', description: 'Trigger on a Shopify event' },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline text-primary">
              SabagaPulse
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <SidebarGroup>
            <SidebarGroupLabel>Triggers</SidebarGroupLabel>
            <SidebarMenu>
              {triggerSteps.map((trigger) => (
                <SidebarMenuItem key={trigger.title}>
                  <SidebarMenuButton
                    onClick={() => handleAddStep(trigger)}
                    tooltip={trigger.description}
                  >
                    <trigger.icon />
                    <span>{trigger.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
               {actionSteps.map((action) => (
                <SidebarMenuItem key={action.title}>
                  <SidebarMenuButton
                    onClick={() => handleAddStep(action)}
                    tooltip={action.description}
                  >
                    <action.icon />
                    <span>{action.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search workflows..."
                className="w-full pl-8 pr-4 py-2 rounded-lg border bg-background"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="profile picture" />
                  <AvatarFallback>SP</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">Sabaga User</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 md:p-6">
          <Tabs defaultValue="designer" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="designer">Designer</TabsTrigger>
              <TabsTrigger value="logs">Monitoring & Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="designer">
              <WorkflowCanvas 
                steps={steps}
                setSteps={setSteps}
                onCreateNewWorkflow={handleCreateNewWorkflow}
              />
            </TabsContent>
            <TabsContent value="logs">
              <MonitoringPanel />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
      <AIFunctionGenerator
        open={isAiGeneratorOpen}
        onOpenChange={setIsAiGeneratorOpen}
        onFunctionGenerated={handleFunctionGenerated}
      />
    </SidebarProvider>
  );
}
