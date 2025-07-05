
import type { ReactElement, ElementType } from 'react';

export type IconName =
  | 'Webhook'
  | 'Mail'
  | 'FlaskConical'
  | 'Database'
  | 'ArrowRightLeft'
  | 'GitMerge'
  | 'Clock'
  | 'ShoppingCart';

export type ApiRequestAuth = {
    type: 'none' | 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyLocation?: 'header' | 'query';
    apiKeyHeaderName?: string;
};

export type ApiRequestData = {
    webhookUrl?: string; // for trigger
    // for API Request action
    apiUrl?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: { id: string; key: string; value: string }[];
    body?: string; // stringified JSON
    auth?: ApiRequestAuth;
}


export type WorkflowStepData = {
  id: string;
  type: 'trigger' | 'action';
  icon: IconName;
  title: string;
  description: string;
  data?: ApiRequestData;
  content?: {
    code: string;
    language: string;
  };
  errorMessage?: {
    title: string;
    description: string;
  };
  status?: 'success' | 'warning' | 'error' | 'default';
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Published';
  steps: WorkflowStepData[];
};
