
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  type OnConnect,
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import type { WorkflowStepData } from '@/lib/types';
import WorkflowNode from './workflow-node';
import { useToast } from '@/hooks/use-toast';
import { getLayoutedElements } from '@/lib/flow-utils';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

type WorkflowCanvasProps = {
  steps: WorkflowStepData[];
  onStepsChange: (steps: WorkflowStepData[]) => void;
  onEditStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  workflowName: string;
  workflowDescription?: string;
};

function WorkflowCanvasComponent({
  steps,
  onStepsChange,
  onEditStep,
  onDeleteStep,
  workflowName,
  workflowDescription,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const { toast } = useToast();

  const onConnect: OnConnect = useCallback(
    (params) => {
        // This is where you would handle new connections if you wanted to.
        // For now, we will not automatically add edges.
    },
    []
  );

  const memoizedNodeCallbacks = useMemo(() => ({
    onEdit: onEditStep,
    onDelete: onDeleteStep
  }), [onEditStep, onDeleteStep]);
  
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(steps, memoizedNodeCallbacks);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    const timer = setTimeout(() => {
        fitView({ duration: 300, padding: 0.1 });
    }, 10);

    return () => clearTimeout(timer);
  }, [steps, memoizedNodeCallbacks, setNodes, setEdges, fitView]);


  const handleConfirmClear = () => {
    onStepsChange([]);
    toast({
        title: 'Canvas Cleared',
        description: 'All steps have been removed from your workflow.',
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-4 md:p-6">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold font-headline">
            {workflowName || 'Untitled Workflow'}
          </h1>
          <p className="text-muted-foreground">
            {workflowDescription ||
              (steps.length > 0
                ? 'A sequence of automated actions.'
                : 'Start building your new workflow by adding steps from the panel.')}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Run Workflow
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClear}
            disabled={steps.length === 0}
          >
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
  );
}
