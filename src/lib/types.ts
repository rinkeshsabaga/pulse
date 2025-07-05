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

export type WorkflowStepData = {
  id: string;
  type: 'trigger' | 'action';
  icon: IconName;
  title: string;
  description: string;
  data?: {
    webhookUrl?: string;
  };
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
