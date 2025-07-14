
import type { Node, Edge } from 'reactflow';
import type { WorkflowStepData } from './types';

const nodeWidth = 320;
const nodeHeight = 90;
const verticalGap = 70;
const horizontalGap = 150;

type NodeCallbacks = {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Creates React Flow nodes and edges from workflow steps with support for branching.
 * @param steps The array of workflow steps.
 * @param nodeData Callbacks for node interactions.
 * @returns An object containing the layouted nodes and edges.
 */
export function getLayoutedElements(steps: WorkflowStepData[], nodeData: NodeCallbacks) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (steps.length === 0) {
    return { nodes, edges };
  }
  
  // Basic vertical layout for all nodes first
  steps.forEach((step, index) => {
    const node: Node = {
      id: step.id,
      type: 'workflowNode',
      position: { x: 0, y: index * (nodeHeight + verticalGap) },
      data: { 
        step,
        ...nodeData
       },
    };
    nodes.push(node);
  });

  // Create edges based on nextStepId logic
  steps.forEach(step => {
    if (step.title === 'Condition' && step.data?.conditionData) {
      // Handle branching for Condition nodes
      step.data.conditionData.cases.forEach((caseItem, index) => {
        if (caseItem.nextStepId) {
          edges.push({
            id: `e-${step.id}-${caseItem.nextStepId}-${caseItem.id}`,
            source: step.id,
            target: caseItem.nextStepId,
            sourceHandle: caseItem.id, // Connect from the specific case handle
            type: 'smoothstep',
            label: caseItem.name,
          });
        }
      });
      if (step.data.conditionData.defaultNextStepId) {
          edges.push({
            id: `e-${step.id}-${step.data.conditionData.defaultNextStepId}-default`,
            source: step.id,
            target: step.data.conditionData.defaultNextStepId,
            sourceHandle: 'default', // Connect from the default handle
            type: 'smoothstep',
            label: 'Default',
          });
      }
    } else if (step.data?.nextStepId) {
      // Handle linear connections for other nodes
      edges.push({
        id: `e-${step.id}-${step.data.nextStepId}`,
        source: step.id,
        target: step.data.nextStepId,
        type: 'smoothstep',
      });
    }
  });


  return { nodes, edges };
}

/**
 * Generates a data context object based on the output of all preceding steps.
 * @param allSteps The full list of workflow steps.
 * @param currentStepId The ID of the current step to generate context for.
 * @returns A data context object for a step's configuration dialog.
 */
export function generateOutputContext(allSteps: WorkflowStepData[], currentStepId: string): Record<string, any> {
  const context: Record<string, any> = {};
  const stepMap = new Map(allSteps.map(step => [step.id, step]));
  
  // For simplicity in this non-graph layout, we'll consider all steps before the current one
  // as potential context providers. A true graph traversal would be needed for complex layouts.
  const currentIndex = allSteps.findIndex(s => s.id === currentStepId);

  if (currentIndex === -1) return {};

  const precedingSteps = allSteps.slice(0, currentIndex);

  precedingSteps.forEach(step => {
    if (step.type === 'trigger') {
      const selectedEvent = step.data?.events?.find(e => e.id === step.data?.selectedEventId);
      context['trigger'] = selectedEvent || { body: { note: 'No event selected or found. This is sample data.' } };
    } else {
      context[step.id] = {
        status: 'success',
        output: {
          note: `This is sample output from step: ${step.title}`
        }
      };
    }
  });

  return context;
}
