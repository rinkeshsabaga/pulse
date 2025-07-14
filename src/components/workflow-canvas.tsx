

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from './ui/separator';
import type { WorkflowStepData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import WorkflowNode from './workflow-node';

const nodeTypes = {
  workflowNode: WorkflowNode,
  addNode: ({data}: { data: { onAdd: () => void, isOnlyNode: boolean }}) => (
      <div className="flex flex-col items-center">
        <Button size="icon" className="rounded-full z-10" onClick={data.onAdd}>
            <Plus className="h-4 w-4" />
        </Button>
        {data.isOnlyNode && <div className="mt-4 text-sm font-semibold">Add a trigger to start</div>}
      </div>
  ),
  endNode: () => (
    <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-muted-foreground/50" />
        </div>
        <div className="mt-2 text-xs font-semibold text-muted-foreground">End of Workflow</div>
    </div>
  ),
};

const getNodePositions = (steps: WorkflowStepData[], layout: 'horizontal' | 'vertical', onAddStep: (index: number) => void) => {
  const nodes = [];
  const edges = [];
  
  const nodeWidth = 320; 
  const nodeHeight = 220; 
  const horizontalGap = 180;
  const verticalGap = 120;
  const addNodeWidth = 50;
  const endNodeHeight = 70;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Add the main workflow node
    const position =
      layout === 'horizontal'
        ? { x: i * (nodeWidth + horizontalGap), y: 100 }
        : { x: 100, y: i * (nodeHeight + verticalGap) };

    nodes.push({
      id: step.id,
      type: 'workflowNode',
      position,
      data: { step },
    });
    
    // Add the '+' node after it
    const addNodePosition = 
      layout === 'horizontal'
      ? { x: position.x + nodeWidth + (horizontalGap - addNodeWidth) / 2, y: position.y + nodeHeight / 2 - 20 }
      : { x: position.x + nodeWidth / 2 - 20, y: position.y + nodeHeight + (verticalGap - endNodeHeight) / 2 };

    nodes.push({
        id: `add-${step.id}`,
        type: 'addNode',
        position: addNodePosition,
        data: { onAdd: () => onAddStep(i) },
        draggable: false,
    });


    // Add edges
    if (i > 0) {
      edges.push({
        id: `e${steps[i-1].id}-add-${steps[i-1].id}`,
        source: `add-${steps[i-1].id}`,
        target: step.id,
        type: 'smoothstep',
        sourceHandle: 'b',
        targetHandle: 'a'
      });
    }

    edges.push({
        id: `e${step.id}-add-${step.id}`,
        source: step.id,
        target: `add-${step.id}`,
        type: 'smoothstep',
        sourceHandle: 'b',
        targetHandle: 'a'
    });
  }

  // Handle empty canvas state
  if (steps.length === 0) {
      nodes.push({
        id: 'start-add',
        type: 'addNode',
        position: { x: 100, y: 100 },
        data: { onAdd: () => onAddStep(-1), isOnlyNode: true },
        draggable: false,
      });
  } else {
      // Add a terminal "End" node
      const lastStep = steps[steps.length - 1];
      const lastStepPosition = layout === 'horizontal'
          ? { x: (steps.length - 1) * (nodeWidth + horizontalGap), y: 100 }
          : { x: 100, y: (steps.length - 1) * (nodeHeight + verticalGap) };
      
      const endNodePosition = 
        layout === 'horizontal'
        ? { x: lastStepPosition.x + nodeWidth + horizontalGap, y: lastStepPosition.y + nodeHeight / 2 - 35 }
        : { x: lastStepPosition.x + nodeWidth / 2 - 25, y: lastStepPosition.y + nodeHeight + verticalGap };
      
      nodes.push({
        id: 'end-node',
        type: 'endNode',
        position: endNodePosition,
        draggable: false,
      });

      edges.push({
        id: `e-add-${lastStep.id}-end`,
        source: `add-${lastStep.id}`,
        target: 'end-node',
        type: 'smoothstep',
        sourceHandle: 'b',
        targetHandle: 'a'
      });
  }
  
  return { nodes, edges };
};


function WorkflowCanvasComponent({
  steps,
  setSteps,
  onEditStep,
  onAddStep,
  workflowName,
  workflowDescription,
}: {
  steps: WorkflowStepData[];
  setSteps: (steps: React.SetStateAction<WorkflowStepData[]>) => void;
  onEditStep: (step: WorkflowStepData, dataContext: any) => void;
  onAddStep: (index: number) => void;
  workflowName: string;
  workflowDescription?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layout, setLayout] = React.useState<'horizontal' | 'vertical'>('horizontal');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const dataContext = useMemo(() => {
    const triggerStep = steps.find(s => s.type === 'trigger' && s.title === 'Webhook');
    if (triggerStep?.data?.selectedEventId && triggerStep.data.events) {
        const selectedEvent = triggerStep.data.events.find(e => e.id === triggerStep.data.selectedEventId);
        if (selectedEvent) {
            return { trigger: selectedEvent };
        }
    }
    return {};
  }, [steps]);

  const handleDeleteStep = useCallback((stepIdToDelete: string) => {
    setSteps((prevSteps) => prevSteps.filter((step) => step.id !== stepIdToDelete));
    toast({
      title: 'Step Deleted',
      description: 'The step has been removed from your workflow.',
    });
  }, [setSteps, toast]);

  const handleEditStep = useCallback((stepToEdit: WorkflowStepData) => {
    if (stepToEdit.type === 'trigger' || stepToEdit.title.includes('Action') || stepToEdit.title.includes('AI') || stepToEdit.title === 'API Request' || stepToEdit.title === 'Custom Code' || stepToEdit.title === 'Wait' || stepToEdit.title === 'Condition' || stepToEdit.title === 'Send Email' || stepToEdit.title === 'Database Query') {
      onEditStep(stepToEdit, dataContext);
    } else {
      toast({
        title: 'Coming Soon!',
        description: `Editing for "${stepToEdit.title}" is not yet implemented.`,
      });
    }
  }, [onEditStep, toast, dataContext]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getNodePositions(steps, layout, onAddStep);

    const nodesWithCallbacks = newNodes.map(node => {
      if (node.type === 'workflowNode') {
          return {
            ...node,
            data: {
                ...node.data,
                layout: layout,
                onEdit: () => handleEditStep(node.data.step),
                onDelete: () => handleDeleteStep(node.id),
            }
          }
      }
      return node;
    });

    setNodes(nodesWithCallbacks);
    setEdges(newEdges);
  }, [steps, layout, handleEditStep, handleDeleteStep, onAddStep, setNodes, setEdges]);


  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  const handleConfirmClear = () => {
    setSteps([]);
    setIsClearDialogOpen(false);
  }

  return (
    <>
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
          <Button variant="outline" onClick={() => setIsClearDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Clear Canvas
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex-1 rounded-lg border bg-background">
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
      </div>
    </div>
    <AlertDialog 
        open={isClearDialogOpen} 
        onOpenChange={setIsClearDialogOpen}
    >
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently remove all steps from the canvas.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmClear} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Canvas
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export function WorkflowCanvas(props: {
  steps: WorkflowStepData[];
  setSteps: (steps: React.SetStateAction<WorkflowStepData[]>) => void;
  onEditStep: (step: WorkflowStepData, dataContext: any) => void;
  onAddStep: (index: number) => void;
  workflowName: string;
  workflowDescription?: string;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...props} />
    </ReactFlowProvider>
  )
}
