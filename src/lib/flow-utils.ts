
import type { Node, Edge } from 'reactflow';
import type { WorkflowStepData } from './types';

const nodeWidth = 320;
const nodeHeight = 90;
const verticalGap = 50;
const horizontalGap = 150;

/**
 * Creates React Flow nodes and edges from workflow steps with a simple vertical layout.
 * @param steps The array of workflow steps.
 * @returns An object containing the layouted nodes and edges.
 */
export function getLayoutedElements(steps: WorkflowStepData[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (steps.length === 0) {
    return { nodes, edges };
  }
  
  let yPos = 0;
  let lastNodeId: string | null = null;
  
  steps.forEach((step, index) => {
    const node: Node = {
      id: step.id,
      type: 'workflowNode',
      position: { x: 0, y: yPos },
      data: { step },
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
 * @param steps The full list of workflow steps.
 * @param parentNodeIds The IDs of the direct parent nodes.
 * @returns A data context object for a step's configuration dialog.
 */
export function generateOutputContext(steps: WorkflowStepData[], parentNodeIds: string[]): Record<string, any> {
  const context: Record<string, any> = {};

  parentNodeIds.forEach(parentId => {
    const parentStep = steps.find(s => s.id === parentId);
    if (!parentStep) return;

    // For a trigger, we expose its event payload
    if (parentStep.type === 'trigger') {
      const selectedEvent = parentStep.data?.events?.find(e => e.id === parentStep.data?.selectedEventId);
      context['trigger'] = selectedEvent || { body: { note: 'No event selected or found. This is sample data.' } };
    } else {
      // For actions, create a generic output object.
      // In a real app, this would be based on the actual execution output of the step.
      context[parentStep.id] = {
        status: 'success',
        output: {
          note: `This is sample output from step: ${parentStep.title}`
        }
      };
    }
  });

  return context;
}
