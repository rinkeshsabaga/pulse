
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Trash2,
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


function WorkflowCanvasComponent({
  steps,
  setSteps,
  onEditStep,
  workflowName,
  workflowDescription,
}: {
  steps: WorkflowStepData[];
  setSteps: (steps: React.SetStateAction<WorkflowStepData[]>) => void;
  onEditStep: (step: WorkflowStepData, dataContext: any) => void;
  workflowName: string;
  workflowDescription?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
    setSteps([]);
    setIsClearDialogOpen(false);
  }

  return (
    <>
    <div className="flex h-full flex-col space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold font-headline">
            {workflowName || 'Untitled Workflow'}
          </h1>
          <p className="text-muted-foreground">
            {workflowDescription || (steps.length > 0
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
          <Button variant="destructive" onClick={() => setIsClearDialogOpen(true)} disabled={steps.length === 0}>
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
  workflowName: string;
  workflowDescription?: string;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...props} />
    </ReactFlowProvider>
  )
}
