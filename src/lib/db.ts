
// This is a mock database. In a real application, you would use a real database.
'use server';

import type { Workflow, WorkflowStepData, WebhookEvent, Credential } from './types';
import { initialSteps } from './initial-data';
import { v4 as uuidv4 } from 'uuid';

// To persist the mock database across hot reloads in development,
// we attach it to the global object.
declare global {
  var __workflows__: Workflow[] | undefined;
  var __credentials__: Credential[] | undefined;
}

const initialWorkflows: Workflow[] = [
  { 
    id: 'wf_1', 
    name: 'Onboarding Email Sequence', 
    description: 'Sends a series of emails to new users.', 
    status: 'Published', 
    steps: initialSteps,
    version: 1,
    history: [
      { version: 1, date: new Date().toISOString(), steps: initialSteps }
    ]
  },
  { 
    id: 'wf_2', 
    name: 'Daily Report', 
    description: 'Generates and emails a daily sales report.', 
    status: 'Published', 
    steps: [],
    version: 1,
    history: [
      { version: 1, date: new Date().toISOString(), steps: [] }
    ]
  },
  { 
    id: 'wf_3', 
    name: 'Failed Payment Alert', 
    description: 'Notifies the team on Slack about failed payments.', 
    status: 'Draft', 
    steps: [],
    version: 1,
    history: [
      { version: 1, date: new Date().toISOString(), steps: [] }
    ]
  },
];

const initialCredentials: Credential[] = [
  {
    id: 'cred_1',
    appName: 'GitHub',
    accountName: 'personal-github',
    type: 'API_KEY',
    authData: { apiKey: 'ghp_mock_key_12345' }
  },
   {
    id: 'cred_2',
    appName: 'Slack',
    accountName: 'work-slack',
    type: 'API_KEY',
    authData: { apiKey: 'xoxb-mock-key-67890' }
  }
];

// In a real app, you'd use a proper database.
// For this dev environment, we'll use a global variable to persist the data.
if (!global.__workflows__) {
    // Use a deep copy to prevent mutation of the initial data array.
    global.__workflows__ = JSON.parse(JSON.stringify(initialWorkflows));
}
if (!global.__credentials__) {
    global.__credentials__ = JSON.parse(JSON.stringify(initialCredentials));
}


const workflows: Workflow[] = global.__workflows__;
const credentials: Credential[] = global.__credentials__;


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
    version: 1,
    history: [], // Initialize with an empty history array
  };
  workflows.push(newWorkflow);
  return JSON.parse(JSON.stringify(newWorkflow));
}

export async function duplicateWorkflow(id: string): Promise<Workflow> {
  const originalWorkflow = await getWorkflowById(id);
  if (!originalWorkflow) {
    throw new Error('Workflow not found');
  }
  const newWorkflow: Workflow = {
    ...originalWorkflow,
    id: `wf_${Date.now()}`,
    name: `Copy of ${originalWorkflow.name}`,
    status: 'Draft',
    version: 1,
    history: [],
  };
  workflows.push(newWorkflow);
  return JSON.parse(JSON.stringify(newWorkflow));
}

export async function deleteWorkflow(id: string): Promise<{ success: boolean }> {
  const index = workflows.findIndex((wf) => wf.id === id);
  if (index > -1) {
    workflows.splice(index, 1);
    return { success: true };
  }
  return { success: false };
}

export async function updateWorkflow(id: string, updatedData: Partial<Omit<Workflow, 'id' | 'version' | 'history'>>): Promise<Workflow | undefined> {
    const index = workflows.findIndex(wf => wf.id === id);
    if (index !== -1) {
        const currentWorkflow = workflows[index];
        const newVersionNumber = currentWorkflow.version + 1;
        const hasRelevantChanges = updatedData.steps || updatedData.name || updatedData.description;

        // Only create a new history entry if there are meaningful changes
        if (hasRelevantChanges && currentWorkflow.steps.length > 0) {
          const newHistoryEntry = {
            version: currentWorkflow.version,
            date: new Date().toISOString(),
            steps: JSON.parse(JSON.stringify(currentWorkflow.steps)),
          };
          currentWorkflow.history.push(newHistoryEntry);
        }

        // Update workflow data
        const updatedWorkflow = {
          ...currentWorkflow,
          ...updatedData,
          version: hasRelevantChanges ? newVersionNumber : currentWorkflow.version,
          history: currentWorkflow.history
        }
        
        workflows[index] = updatedWorkflow;

        return JSON.parse(JSON.stringify(updatedWorkflow));
    }
    return undefined;
}

export async function addTestWebhookEvent(workflowId: string, stepId: string): Promise<Workflow | null> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) return null;

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step || !step.data) return null;

    const newEvent: WebhookEvent = {
        id: `evt_${uuidv4()}`,
        receivedAt: new Date().toISOString(),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mock-Webhook-Client/1.0'
        },
        body: {
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            product: 'SabagaPulse Pro',
            event_type: 'subscription_created',
            timestamp: new Date().toISOString()
        }
    };
    
    if (!step.data.events) {
        step.data.events = [];
    }
    // Add to the beginning of the array
    step.data.events.unshift(newEvent);
    
    // Keep only the last 10 events
    step.data.events = step.data.events.slice(0, 10);
    
    step.data.selectedEventId = newEvent.id;

    // This update should not create a new version
    const index = workflows.findIndex(wf => wf.id === workflowId);
    if (index !== -1) {
        const workflowToUpdate = workflows[index];
        const stepToUpdate = workflowToUpdate.steps.find(s => s.id === stepId);
        if (stepToUpdate) {
            stepToUpdate.data = step.data;
        }
        return JSON.parse(JSON.stringify(workflows[index]));
    }
    return null;
}


// Credentials Management
export async function getCredentials(): Promise<Credential[]> {
  return JSON.parse(JSON.stringify(credentials));
}

export async function getCredentialById(id: string): Promise<Credential | undefined> {
  const credential = credentials.find(c => c.id === id);
  return credential ? JSON.parse(JSON.stringify(credential)) : undefined;
}

export async function addCredential(credData: Omit<Credential, 'id'>): Promise<Credential> {
  const newCredential: Credential = {
    id: `cred_${Date.now()}`,
    ...credData,
  };
  credentials.push(newCredential);
  return JSON.parse(JSON.stringify(newCredential));
}

export async function updateCredential(id: string, updatedData: Omit<Credential, 'id'>): Promise<Credential | undefined> {
  const index = credentials.findIndex(c => c.id === id);
  if (index > -1) {
    credentials[index] = { id, ...updatedData };
    return JSON.parse(JSON.stringify(credentials[index]));
  }
  return undefined;
}

export async function deleteCredential(id: string): Promise<{ success: boolean }> {
  const index = credentials.findIndex(c => c.id === id);
  if (index > -1) {
    credentials.splice(index, 1);
    return { success: true };
  }
  return { success: false };
}
