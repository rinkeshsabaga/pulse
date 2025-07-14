
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
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';

import { MonitoringPanel } from './monitoring-panel';
import type { IconName } from '@/lib/types';
import * as icons from 'lucide-react';
import { Button } from './ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const Triggers = [
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify', description: 'Trigger on a Shopify event' },
    { type: 'trigger' as const, icon: 'AppWindow' as const, title: 'App Event', description: 'Trigger from an app' },
];

const Actions = [
    { type: 'action' as const, icon: 'GitBranch' as const, title: 'If/Else', description: 'Branch based on a condition' },
    { type: 'action' as const, icon: 'GitCommit' as const, title: 'Switch', description: 'Multi-path branching logic' },
    { type: 'action' as const, icon: 'Split' as const, title: 'Parallel', description: 'Run branches simultaneously' },
    { type: 'action' as const, icon: 'Filter' as const, title: 'Filter', description: 'Stop if condition not met' },
    { type: 'action' as const, icon: 'AppWindow' as const, title: 'App Action', description: 'Perform an action in an app' },
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
  GitCommit: icons.GitCommit,
  Split: icons.Split,
  Filter: icons.Filter,
};


function DashboardLayoutInternal({ children, onAddStep }: { children: React.ReactNode, onAddStep: (step: { type: 'trigger' | 'action', icon: IconName; title: string, description: string }) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="relative h-full w-full overflow-hidden flex">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="p-0 border-r w-[400px] sm:w-[400px]" hideCloseButton>
                 <SheetHeader className="sr-only">
                  <SheetTitle>Workflow Tools</SheetTitle>
                  <SheetDescription>Select tools and view logs for the current workflow.</SheetDescription>
                </SheetHeader>
                <div className="flex h-full flex-col">
                    <Tabs defaultValue="designer" className="flex h-full w-full flex-col">
                    <div className="p-4 border-b">
                        <TabsList className="w-full">
                            <TabsTrigger value="designer" className="flex-1">Designer</TabsTrigger>
                            <TabsTrigger value="logs" className="flex-1">Monitoring</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="designer" className="flex-1 overflow-y-auto p-4">
                        <Accordion type="single" collapsible defaultValue="actions" className="w-full">
                            <AccordionItem value="triggers">
                                <AccordionTrigger>Triggers</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 gap-2">
                                    {Triggers.map((tool) => {
                                        const Icon = iconMap[tool.icon];
                                        return (
                                        <Card key={tool.title} onClick={() => onAddStep(tool)} className="cursor-pointer hover:bg-muted/50">
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
                                            <Card key={tool.title} onClick={() => onAddStep(tool)} className="cursor-pointer hover:bg-muted/50">
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
                    <TabsContent value="logs" className="flex-1 p-4">
                        <MonitoringPanel />
                    </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
        <SidebarInset style={{ marginLeft: isSidebarOpen ? '400px' : '0' }} className="h-full flex-1">
            <div className="absolute top-4 left-4 z-10">
              <Button size="icon" variant="outline" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
              </Button>
            </div>
            {children}
        </SidebarInset>
    </div>
  );
}

export function DashboardLayout({ children, onAddStep }: { children: React.ReactNode, onAddStep: (step: { type: 'trigger' | 'action', icon: IconName; title: string, description: string }) => void }) {
  return (
    <SidebarProvider>
      <DashboardLayoutInternal onAddStep={onAddStep}>
        {children}
      </DashboardLayoutInternal>
    </SidebarProvider>
  )
}
