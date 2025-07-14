
import type { Node, Edge } from 'reactflow';
import type { WorkflowStepData } from './types';

const nodeWidth = 320;
const nodeHeight = 90;
const verticalGap = 50;
const horizontalGap = 150;

type NodeCallbacks = {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Creates React Flow nodes and edges from workflow steps with a simple vertical layout.
 * @param steps The array of workflow steps.
 * @returns An object containing the layouted nodes and edges.
 */
export function getLayoutedElements(steps: WorkflowStepData[], nodeData: NodeCallbacks) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (steps.length === 0) {
    return { nodes, edges };
  }
  
  let yPos = 0;
  let lastNodeId: string | null = null;
  
  steps.forEach((step) => {
    const node: Node = {
      id: step.id,
      type: 'workflowNode',
      position: { x: 0, y: yPos },
      data: { 
        step,
        ...nodeData
       },
    };
    nodes.push(node);
    yPos += nodeHeight + verticalGap;

    if (lastNodeId) {
       edges.push({
           id: `e-${lastNodeId}-${step.id}`,
           source: lastNodeId,
           target: step.id,
           type: 'smoothstep'
       });
    }

    lastNodeId = step.id;
  });

  return { nodes, edges };
}

/**
 * Generates a data context object based on the output of parent steps.
 * This version finds the parent node without needing the full edge list.
 * @param allSteps The full list of workflow steps.
 * @param currentStepId The ID of the current step to find parents for.
 * @returns A data context object for a step's configuration dialog.
 */
export function generateOutputContext(allSteps: WorkflowStepData[], currentStepId: string): Record<string, any> {
  const context: Record<string, any> = {};
  
  // Find the index of the current step
  const currentIndex = allSteps.findIndex(s => s.id === currentStepId);

  // If it's the first step (index 0), it has no parents in our simple layout
  if (currentIndex <= 0) {
    return context;
  }
  
  // The parent is the step right before it in the array
  const parentStep = allSteps[currentIndex - 1];

  if (parentStep) {
     if (parentStep.type === 'trigger') {
      const selectedEvent = parentStep.data?.events?.find(e => e.id === parentStep.data?.selectedEventId);
      context['trigger'] = selectedEvent || { body: { note: 'No event selected or found. This is sample data.' } };
    } else {
      context[parentStep.id] = {
        status: 'success',
        output: {
          note: `This is sample output from step: ${parentStep.title}`
        }
      };
    }
  }

  return context;
}
