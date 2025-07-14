
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
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

import { MonitoringPanel } from './monitoring-panel';
import type { WorkflowStepData, IconName } from '@/lib/types';
import * as icons from 'lucide-react';

const Triggers = [
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify', description: 'Trigger on a Shopify event' },
    { type: 'trigger' as const, icon: 'AppWindow' as const, title: 'App Event', description: 'Trigger from an app' },
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


export function DashboardLayout({ children, onAddStep }: { children: React.ReactNode, onAddStep: (step: { type: 'trigger' | 'action', icon: IconName; title: string, description: string }) => void }) {
  return (
    <SidebarProvider>
        <div className="relative h-screen overflow-hidden">
            <Sidebar>
                <Sheet open>
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
                            <TabsContent value="designer" className="flex-1 overflow-y-auto">
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
                            <TabsContent value="logs" className="flex-1">
                                <MonitoringPanel />
                            </TabsContent>
                            </Tabs>
                        </div>
                    </SheetContent>
                </Sheet>
            </Sidebar>
            <SidebarInset>
                <div className="absolute top-4 left-4 z-10">
                    <SidebarTrigger />
                </div>
                {children}
            </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

    