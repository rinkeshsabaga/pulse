// This is a mock database. In a real application, you would use a real database.
'use server';

import type { Workflow } from './types';
import { initialSteps } from './initial-data';

let workflows: Workflow[] = [
  { 
    id: 'wf_1', 
    name: 'Onboarding Email Sequence', 
    description: 'Sends a series of emails to new users.', 
    status: 'Published', 
    steps: initialSteps 
  },
  { 
    id: 'wf_2', 
    name: 'Daily Report', 
    description: 'Generates and emails a daily sales report.', 
    status: 'Published', 
    steps: [] 
  },
  { 
    id: 'wf_3', 
    name: 'Failed Payment Alert', 
    description: 'Notifies the team on Slack about failed payments.', 
    status: 'Draft', 
    steps: [] 
  },
];


export async function getWorkflows(): Promise<Workflow[]> {
  // In a real app, you'd fetch this from a database
  return JSON.parse(JSON.stringify(workflows));
}

export async function getWorkflowById(id: string): Promise<Workflow | undefined> {
  const workflow = workflows.find((wf) => wf.id === id);
  if (!workflow) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(workflow));
}

export async function addWorkflow(workflowData: { name: string; description?: string }): Promise<Workflow> {
  const newWorkflow: Workflow = {
    id: `wf_${Date.now()}`,
    name: workflowData.name,
    description: workflowData.description || '',
    status: 'Draft',
    steps: [],
  };
  workflows.push(newWorkflow);
  return newWorkflow;
}

export async function deleteWorkflow(id: string): Promise<{ success: boolean }> {
  const initialLength = workflows.length;
  workflows = workflows.filter((wf) => wf.id !== id);
  return { success: workflows.length < initialLength };
}

export async function updateWorkflow(id: string, updatedData: Partial<Omit<Workflow, 'id'>>): Promise<Workflow | undefined> {
    const index = workflows.findIndex(wf => wf.id === id);
    if (index !== -1) {
        workflows[index] = { ...workflows[index], ...updatedData };
        return workflows[index];
    }
    return undefined;
}
