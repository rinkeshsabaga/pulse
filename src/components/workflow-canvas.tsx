
'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
  useReactFlow,
} from 'reactflow';
import { Button } from '@/components/ui/button';
import {
  Play,
  Trash2,
  GitBranchPlus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Separator } from './ui/separator';
import type { WorkflowStepData, IconName } from '@/lib/types';
import WorkflowNode from './workflow-node';
import { useToast } from '@/hooks/use-toast';
import {
  generateOutputContext,
  getLayoutedElements,
} from '@/lib/flow-utils';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

type WorkflowCanvasProps = {
    steps: WorkflowStepData[];
    setSteps: React.Dispatch<React.SetStateAction<WorkflowStepData[]>>;
    onEditStep: (step: WorkflowStepData, dataContext: any) => void;
    workflowName: string;
    workflowDescription?: string;
}

function WorkflowCanvasComponent({ steps, setSteps, onEditStep, workflowName, workflowDescription }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );
  
  const handleEditStep = useCallback((stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    // Find the parent steps to build the data context
    const parentEdges = edges.filter(e => e.target === stepId);
    const parentNodeIds = parentEdges.map(e => e.source);
    
    const dataContext = generateOutputContext(steps, parentNodeIds);

    onEditStep(step, dataContext);
  }, [steps, edges, onEditStep]);


  const handleDeleteStep = useCallback((stepIdToDelete: string) => {
    setSteps((prevSteps) => prevSteps.filter((step) => step.id !== stepIdToDelete));
    toast({
      title: 'Step Deleted',
      description: 'The step has been removed from your workflow.',
    });
  }, [setSteps, toast]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(steps);
    
    const nodesWithCallbacks = newNodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            onEdit: () => handleEditStep(node.id),
            onDelete: () => handleDeleteStep(node.id),
        }
    }));
    setNodes(nodesWithCallbacks);
    setEdges(newEdges);
     window.requestAnimationFrame(() => {
        fitView();
    });
  }, [steps, handleEditStep, handleDeleteStep, setNodes, setEdges, fitView]);
  
  const handleConfirmClear = () => {
    setSteps([]);
  }


  return (
    <div className="flex h-full flex-col">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-4 md:p-6">
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
            <Button variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Run Workflow
            </Button>
            <Button variant="destructive" onClick={handleConfirmClear} disabled={steps.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Canvas
            </Button>
        </div>
        </div>

        <Separator />

        <div className="flex-1 h-full w-full">
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
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...props} />
    </ReactFlowProvider>
  )
}
