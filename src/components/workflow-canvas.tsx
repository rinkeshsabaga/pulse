
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type Connection,
  type Edge,
} from 'reactflow';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Trash2,
} from 'lucide-react';
import { Separator } from './ui/separator';
import { MonitoringPanel } from './monitoring-panel';
import type { Workflow, WorkflowStepData, IconName } from '@/lib/types';
import * as icons from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import WorkflowNode from './workflow-node';
import { useToast } from '@/hooks/use-toast';
import { updateWorkflow } from '@/lib/db';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const Triggers = [
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify', description: 'Trigger on a Shopify event' },
];

const Actions = [
    { type: 'action' as const, icon: 'Mail' as const, title: 'Send Email', description: 'Send an email via SendGrid' },
    { type: 'action' as const, icon: 'FlaskConical' as const, title: 'Custom AI Function', description: 'Generate code with AI' },
    { type: 'action' as const, icon: 'Database' as const, title: 'Database Query', description: 'Interact with a database' },
    { type: 'action' as const, icon: 'ArrowRightLeft' as const, title: 'API Request', description: 'Make an HTTP request' },
    { type: 'action' as const, icon: 'GitBranch' as const, title: 'Condition', description: 'Branch workflow on conditions' },
    { type: 'action' as const, icon: 'Clock' as const, title: 'Wait', description: 'Delay workflow execution' },
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
};

const getNodePositions = (steps: WorkflowStepData[]) => {
  const nodes = [];
  const edges = [];
  
  const nodeWidth = 320; 
  const nodeHeight = 160; 
  const horizontalGap = 80;
  const verticalGap = 80;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Position nodes in a simple vertical layout
    const position = { x: 100, y: i * (nodeHeight + verticalGap) + 100 };

    nodes.push({
      id: step.id,
      type: 'workflowNode',
      position,
      data: { step },
    });
    
    // Connect to the previous node
    if (i > 0) {
      edges.push({
        id: `e${steps[i-1].id}-${step.id}`,
        source: steps[i-1].id,
        target: step.id,
        type: 'smoothstep',
        sourceHandle: 'b',
        targetHandle: 'a'
      });
    }
  }
  return { nodes, edges };
};


function WorkflowCanvasComponent({ workflow }: { workflow: Workflow }) {
  const [steps, setSteps] = useState<WorkflowStepData[]>(workflow.steps);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
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
    handleSetSteps(prev => [...prev, newStep]);
  };

  const handleDeleteStep = useCallback((stepIdToDelete: string) => {
    handleSetSteps((prevSteps) => prevSteps.filter((step) => step.id !== stepIdToDelete));
    toast({
      title: 'Step Deleted',
      description: 'The step has been removed from your workflow.',
    });
  }, [toast]);

  const handleEditStep = useCallback((stepToEdit: WorkflowStepData) => {
    // This is where you would open a dialog to edit the step's properties
    toast({
      title: 'Coming Soon!',
      description: `Editing for "${stepToEdit.title}" is not yet implemented.`,
    });
  }, [toast]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getNodePositions(steps);
    const nodesWithCallbacks = newNodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            onEdit: () => handleEditStep(node.data.step),
            onDelete: () => handleDeleteStep(node.id),
        }
    }));
    setNodes(nodesWithCallbacks);
    setEdges(newEdges);
  }, [steps, handleEditStep, handleDeleteStep, setNodes, setEdges]);
  
  const handleConfirmClear = () => {
    handleSetSteps([]);
  }


  return (
    <div className="relative h-screen overflow-hidden">
      <Sheet open>
        <SheetContent side="left" className="p-0 border-r" hideCloseButton>
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

      <div className="ml-0 md:ml-[var(--sheet-content-width)] h-full">
        <div className="flex h-full flex-col space-y-6 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold font-headline">
                {workflow.name || 'Untitled Workflow'}
              </h1>
              <p className="text-muted-foreground">
                {workflow.description || (steps.length > 0
                  ? 'A sequence of automated actions.'
                  : 'Start building your new workflow by adding steps from the panel.')}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {steps.length > 0 && (
                <>
                  <Select defaultValue="1.0">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">Version 1.0 (latest)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Play className="mr-2 h-4 w-4" />
                    Run Workflow
                  </Button>
                </>
              )}
              <Button variant="destructive" onClick={handleConfirmClear} disabled={steps.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Canvas
              </Button>
            </div>
          </div>

          <Separator />

          <Card className="flex-1">
            <CardContent className="h-full p-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
              >
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
                <Background variant="dots" gap={16} size={1} />
              </ReactFlow>
            </CardContent>
          </Card>
        </div>
      </div>
      <style jsx global>{`
        :root {
          --sheet-content-width: 450px;
        }
        .ml-0.md\\:ml-\\[var\\(--sheet-content-width\\)\\] {
          margin-left: var(--sheet-content-width);
        }
        @media (max-width: 768px) {
            .ml-0.md\\:ml-\\[var\\(--sheet-content-width\\)\\] {
                margin-left: 0;
            }
        }
      `}</style>
    </div>
  );
}

export function WorkflowCanvas({ workflow }: { workflow: Workflow }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent workflow={workflow} />
    </ReactFlowProvider>
  )
}
