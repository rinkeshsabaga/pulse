
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
  addEdge,
  Connection,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  EdgeChange,
  NodeChange,
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Play, Trash2, History, Loader2 } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { VersionHistoryPanel } from './version-history-panel';
import { runWorkflow } from '@/ai/flows/run-workflow-flow';
import { handleUpdate } from '@/app/actions';


type WorkflowCanvasProps = {
  workflow: WorkflowType;
  steps: WorkflowStepData[];
  onStepsChange: (steps: WorkflowStepData[] | ((prev: WorkflowStepData[]) => WorkflowStepData[])) => void;
  onEditStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onRevert: (version: WorkflowVersion) => void;
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
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState(workflow);
  const { fitView } = useReactFlow();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentWorkflow(workflow);
  }, [workflow]);

  const nodeCallbacks = useMemo(() => ({
    onEdit: onEditStep,
    onDelete: onDeleteStep,
  }), [onEditStep, onDeleteStep]);
  
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(steps, nodeCallbacks);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    window.requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.2 });
    });

  }, [steps, nodeCallbacks, setNodes, setEdges, fitView]);

  const onConnect = useCallback((params: Connection) => {
    const { source, sourceHandle, target } = params;
    if (!source || !target) return;

    onStepsChange(prevSteps => {
        const newSteps = [...prevSteps];
        const sourceStepIndex = newSteps.findIndex(s => s.id === source);
        if (sourceStepIndex === -1) return prevSteps;

        const sourceStep = { ...newSteps[sourceStepIndex] };
        
        if (sourceStep.title === 'Condition' && sourceStep.data?.conditionData) {
            const conditionData = { ...sourceStep.data.conditionData };
            const cases = [...(conditionData.cases || [])];

            if (sourceHandle === 'default') {
                conditionData.defaultNextStepId = target;
            } else {
                const caseIndex = cases.findIndex(c => c.id === sourceHandle);
                if (caseIndex !== -1) {
                    cases[caseIndex] = { ...cases[caseIndex], nextStepId: target };
                }
            }
            sourceStep.data = { ...sourceStep.data, conditionData: { ...conditionData, cases } };
        } else if (sourceStep.title === 'Parallel' && sourceStep.data?.branches) {
            const branches = [...sourceStep.data.branches];
            const branchIndex = branches.findIndex(b => b.id === sourceHandle);
            if (branchIndex !== -1) {
                branches[branchIndex] = { ...branches[branchIndex], nextStepId: target };
            }
            sourceStep.data = { ...sourceStep.data, branches };
        } else {
            sourceStep.data = { ...sourceStep.data, nextStepId: target };
        }

        newSteps[sourceStepIndex] = sourceStep;
        return newSteps;
    });

}, [onStepsChange]);

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const edgesToRemove = changes.filter((c): c is EdgeChange & { type: 'remove' } => c.type === 'remove');
  
      if (edgesToRemove.length > 0) {
        onStepsChange(currentSteps => {
          let nextSteps = [...currentSteps];
  
          edgesToRemove.forEach(change => {
            const edgeToRemove = edges.find(edge => edge.id === change.id);
            if (!edgeToRemove) return;
  
            const sourceStepIndex = nextSteps.findIndex(s => s.id === edgeToRemove.source);
            if (sourceStepIndex === -1) return;
  
            const sourceStep = { ...nextSteps[sourceStepIndex] };
            let stepWasModified = false;
  
            if (sourceStep.title === 'Condition' && sourceStep.data?.conditionData) {
              const conditionData = { ...sourceStep.data.conditionData };
              if (edgeToRemove.sourceHandle === 'default') {
                conditionData.defaultNextStepId = undefined;
                stepWasModified = true;
              } else {
                const caseIndex = conditionData.cases.findIndex(c => c.id === edgeToRemove.sourceHandle);
                if (caseIndex !== -1) {
                  conditionData.cases[caseIndex].nextStepId = undefined;
                  stepWasModified = true;
                }
              }
              if (stepWasModified) {
                sourceStep.data = { ...sourceStep.data, conditionData };
              }
            } else if (sourceStep.title === 'Parallel' && sourceStep.data?.branches) {
                const branches = [...sourceStep.data.branches];
                const branchIndex = branches.findIndex(b => b.id === edgeToRemove.sourceHandle);
                if (branchIndex !== -1) {
                    branches[branchIndex].nextStepId = undefined;
                    sourceStep.data = { ...sourceStep.data, branches };
                    stepWasModified = true;
                }
            } else if (sourceStep.data?.nextStepId === edgeToRemove.target) {
              const { nextStepId, ...restData } = sourceStep.data;
              sourceStep.data = restData;
              stepWasModified = true;
            }
  
            if (stepWasModified) {
              nextSteps[sourceStepIndex] = sourceStep;
            }
          });
  
          return nextSteps;
        });
      }
  
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges, onStepsChange, edges]
  );

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes]);


  const handleConfirmClear = () => {
    onStepsChange([]);
    toast({
        title: 'Canvas Cleared',
        description: 'All steps have been removed from your workflow.',
    });
    setIsClearAlertOpen(false);
  };
  
  const handleRevertVersion = (version: WorkflowVersion) => {
    onRevert(version);
    setIsHistoryOpen(false);
  }

  const handleRunWorkflow = async () => {
    if (steps.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty Workflow',
        description: 'Cannot run a workflow with no steps.',
      });
      return;
    }
    setIsExecuting(true);
    try {
      const result = await runWorkflow({ steps });
      if (result.success) {
        toast({
          title: 'Workflow Run Successful',
          description: result.message,
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Workflow Run Failed',
          description: result.message,
        });
      }
    } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Execution Error',
          description: `An unexpected error occurred: ${error.message}`,
        });
    } finally {
        setIsExecuting(false);
    }
  };

  const handleStatusChange = async (isPublished: boolean) => {
    setIsSaving(true);
    const newStatus = isPublished ? 'Published' : 'Draft';
    try {
        const updatedWorkflow = await handleUpdate(currentWorkflow.id, { status: newStatus });
        if (updatedWorkflow) {
            setCurrentWorkflow(updatedWorkflow);
            toast({
                title: 'Status Updated',
                description: `Workflow is now ${newStatus}.`
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update workflow status.'
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
    <div className="flex-1 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6 md:pl-20">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold font-headline truncate">
              {currentWorkflow.name || 'Untitled Workflow'}
            </h1>
            <Badge variant="outline">v{currentWorkflow.version}</Badge>
            <div className="flex items-center space-x-2 ml-auto md:ml-0">
                <Switch 
                    id="publish-toggle" 
                    checked={currentWorkflow.status === 'Published'}
                    onCheckedChange={handleStatusChange}
                    disabled={isSaving}
                />
                <Label htmlFor="publish-toggle" className="text-sm font-medium whitespace-nowrap">
                    {isSaving ? 'Saving...' : (currentWorkflow.status === 'Published' ? 'Published' : 'Draft')}
                </Label>
            </div>
          </div>
          <p className="text-muted-foreground truncate">
            {currentWorkflow.description ||
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
          <Button variant="outline" onClick={handleRunWorkflow} disabled={isExecuting}>
            {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run Workflow
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsClearAlertOpen(true)}
            disabled={steps.length === 0 || isExecuting}
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
        history={currentWorkflow.history}
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
