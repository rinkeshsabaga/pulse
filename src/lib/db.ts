// This is a mock database. In a real application, you would use a real database.
'use server';

import type { Credential, Workflow } from './types';
import { initialSteps } from './initial-data';

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

// In a real app, you'd use a proper database.
// For this dev environment, we'll use a global variable to persist the data.
if (!global.__workflows__) {
    // Use a deep copy to prevent mutation of the initial data array.
    global.__workflows__ = JSON.parse(JSON.stringify(initialWorkflows));
}

const workflows: Workflow[] = global.__workflows__;


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

export async function updateWorkflow(id: string, updatedData: Partial<Omit<Workflow, 'id'>>): Promise<Workflow | undefined> {
    const index = workflows.findIndex(wf => wf.id === id);
    if (index !== -1) {
        workflows[index] = { ...workflows[index], ...updatedData };
        return JSON.parse(JSON.stringify(workflows[index]));
    }
    return undefined;
}

// =================================================================
// CREDENTIALS MOCK DATABASE
// =================================================================

const initialCredentials: Credential[] = [
    {
        id: 'cred_1',
        appName: 'GitHub',
        type: 'OAuth',
        accountName: 'my-github-user',
        authData: {
            accessToken: 'gho_mock_access_token_for_my_github_user',
            refreshToken: 'ghr_mock_refresh_token'
        },
    },
    {
        id: 'cred_2',
        appName: 'Salesforce',
        type: 'OAuth',
        accountName: 'my-sales-org',
        authData: {
            accessToken: 'sf_mock_access_token',
            refreshToken: 'sf_mock_refresh_token',
            instanceUrl: 'https://my-sales-org.my.salesforce.com'
        },
    },
];

if (!global.__credentials__) {
    global.__credentials__ = JSON.parse(JSON.stringify(initialCredentials));
}

const credentials = global.__credentials__;

export async function getCredentials(): Promise<Credential[]> {
  // In a real app, you'd fetch this from a database and decrypt secrets
  // For prototyping, we'll store them in-memory, but this is NOT secure for production.
  return JSON.parse(JSON.stringify(credentials));
}

export async function getCredentialById(id: string): Promise<Credential | undefined> {
  const credential = credentials.find((cred) => cred.id === id);
  if (!credential) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(credential));
}

export async function addCredential(credentialData: Omit<Credential, 'id'>): Promise<Credential> {
  const newCredential: Credential = {
    id: `cred_${Date.now()}`,
    ...credentialData
  };
  credentials.push(newCredential);
  return JSON.parse(JSON.stringify(newCredential));
}

export async function updateCredential(id: string, updatedData: Partial<Omit<Credential, 'id'>>): Promise<Credential | undefined> {
    const index = credentials.findIndex(cred => cred.id === id);
    if (index !== -1) {
        credentials[index] = { ...credentials[index], ...updatedData };
        return JSON.parse(JSON.stringify(credentials[index]));
    }
    return undefined;
}


export async function deleteCredential(id: string): Promise<{ success: boolean }> {
  const index = credentials.findIndex((cred) => cred.id === id);
  if (index > -1) {
    credentials.splice(index, 1);
    return { success: true };
  }
  return { success: false };
}
