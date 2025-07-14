
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
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Play, Trash2, History } from 'lucide-react';
import { Separator } from './ui/separator';
import type { Workflow as WorkflowType, WorkflowStepData, WorkflowVersion } from '@/lib/types';
import WorkflowNode from './workflow-node';
import { useToast } from '@/hooks/use-toast';
import { getLayoutedElements } from '@/lib/flow-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from './ui/badge';
import { VersionHistoryPanel } from './version-history-panel';

type WorkflowCanvasProps = {
  workflow: WorkflowType;
  steps: WorkflowStepData[];
  onStepsChange: (steps: WorkflowStepData[] | ((prev: WorkflowStepData[]) => WorkflowStepData[])) => void;
  onEditStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onRevert: (steps: WorkflowStepData[]) => void;
};

const nodeTypes = {
  workflowNode: WorkflowNode,
};

function WorkflowCanvasComponent({
  workflow,
  steps,
  onStepsChange,
  onEditStep,
  onDeleteStep,
  onRevert,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { fitView } = useReactFlow();
  const { toast } = useToast();

  const nodeCallbacks = useMemo(() => ({
    onEdit: onEditStep,
    onDelete: onDeleteStep,
  }), [onEditStep, onDeleteStep]);
  
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(steps, nodeCallbacks);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    window.requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.1 });
    });

  }, [steps, nodeCallbacks, setNodes, setEdges, fitView]);


  const handleConfirmClear = () => {
    onStepsChange([]);
    toast({
        title: 'Canvas Cleared',
        description: 'All steps have been removed from your workflow.',
    });
    setIsClearAlertOpen(false);
  };
  
  const handleRevertVersion = (version: WorkflowVersion) => {
    onRevert(version.steps);
    setIsHistoryOpen(false);
  }

  return (
    <>
    <div className="flex-1 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-4 md:p-6">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold font-headline">
              {workflow.name || 'Untitled Workflow'}
            </h1>
            <Badge variant="outline">v{workflow.version}</Badge>
            <Badge variant={workflow.status === 'Draft' ? 'secondary' : 'default'}>{workflow.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {workflow.description ||
              (steps.length > 0
                ? 'A sequence of automated actions.'
                : 'Start building your new workflow by adding steps from the panel.')}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
           <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Run Workflow
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsClearAlertOpen(true)}
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
          onNodesChange={onNodesChange as OnNodesChange}
          onEdgesChange={onEdgesChange as OnEdgesChange}
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
    <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all steps from your workflow.
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
    <VersionHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={workflow.history}
        onRevert={handleRevertVersion}
    />
    </>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...props} />
    </ReactFlowProvider>
  );
}
