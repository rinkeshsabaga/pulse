
'use client';

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type Connection,
  type Edge,
} from 'reactflow';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  Plus,
  Workflow,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Separator } from './ui/separator';
import type { WorkflowStepData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import WorkflowNode from './workflow-node';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const getNodePositions = (steps: WorkflowStepData[], layout: 'horizontal' | 'vertical') => {
  const nodes = [];
  const edges = [];
  
  const nodeWidth = 320; // from w-80 on the card
  const nodeHeight = 220; // estimated height
  const horizontalGap = 150;
  const verticalGap = 100;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const position =
      layout === 'horizontal'
        ? { x: i * (nodeWidth + horizontalGap), y: 100 }
        : { x: 100, y: i * (nodeHeight + verticalGap) };

    nodes.push({
      id: step.id,
      type: 'workflowNode',
      position,
      data: {
        step,
      },
    });

    if (i > 0) {
      edges.push({
        id: `e${steps[i-1].id}-${step.id}`,
        source: steps[i-1].id,
        target: step.id,
        type: 'smoothstep',
        animated: step.status === 'success'
      });
    }
  }
  return { nodes, edges };
};


function WorkflowCanvasComponent({
  steps,
  setSteps,
  onCreateNewWorkflow,
  onEditStep,
  workflowName,
  workflowDescription,
}: {
  steps: WorkflowStepData[];
  setSteps: (steps: React.SetStateAction<WorkflowStepData[]>) => void;
  onCreateNewWorkflow: () => void;
  onEditStep: (step: WorkflowStepData) => void;
  workflowName: string;
  workflowDescription?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layout, setLayout] = React.useState<'horizontal' | 'vertical'>('horizontal');
  const { toast } = useToast();
  
  const handleDeleteStep = useCallback((stepIdToDelete: string) => {
    setSteps((prevSteps) => prevSteps.filter((step) => step.id !== stepIdToDelete));
    toast({
      title: 'Step Deleted',
      description: 'The step has been removed from your workflow.',
    });
  }, [setSteps, toast]);

  const handleEditStep = useCallback((stepToEdit: WorkflowStepData) => {
    if (stepToEdit.type === 'trigger' || stepToEdit.title.includes('Action') || stepToEdit.title === 'API Request' || stepToEdit.title === 'Custom Code' || stepToEdit.title === 'Wait') {
      onEditStep(stepToEdit);
    } else {
      toast({
        title: 'Coming Soon!',
        description: `Editing for "${stepToEdit.title}" is not yet implemented.`,
      });
    }
  }, [onEditStep, toast]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getNodePositions(steps, layout);

    const nodesWithCallbacks = newNodes.map(node => ({
      ...node,
      data: {
        step: node.data.step,
        onEdit: () => handleEditStep(node.data.step),
        onDelete: () => handleDeleteStep(node.id),
      }
    }));

    setNodes(nodesWithCallbacks);
    setEdges(newEdges);
  }, [steps, layout, handleEditStep, handleDeleteStep, setNodes, setEdges]);


  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold font-headline">
            {workflowName || 'Untitled Workflow'}
          </h1>
          <p className="text-muted-foreground">
            {workflowDescription || (steps.length > 0
              ? 'A sequence of automated actions.'
              : 'Start building your new workflow by adding steps.')}
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
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button
              variant={layout === 'horizontal' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLayout('horizontal')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Horizontal Layout</span>
            </Button>
            <Button
              variant={layout === 'vertical' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLayout('vertical')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Vertical Layout</span>
            </Button>
          </div>
          <Button variant="outline" onClick={onCreateNewWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            Clear Canvas
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex-1 rounded-lg border bg-background">
        {steps.length > 0 ? (
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
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4">
            <Card className="w-full max-w-lg border-dashed bg-transparent hover:border-primary/50 transition-colors">
              <CardContent className="p-10 text-center flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Workflow className="h-8 w-8 text-primary" />
                </div>
                <p className="text-foreground font-semibold">
                  Your workflow canvas is empty
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Use the sidebar to add steps and build out your automation.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: {
  steps: WorkflowStepData[];
  setSteps: (steps: React.SetStateAction<WorkflowStepData[]>) => void;
  onCreateNewWorkflow: () => void;
  onEditStep: (step: WorkflowStepData) => void;
  workflowName: string;
  workflowDescription?: string;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...props} />
    </ReactFlowProvider>
  )
}
