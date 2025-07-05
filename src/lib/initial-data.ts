import type { WorkflowStepData } from './types';

export const initialSteps: WorkflowStepData[] = [
    {
      id: 'step-1',
      type: 'trigger',
      icon: 'Webhook',
      title: 'HTTP Request Recieved',
      description: 'via Webhook',
      status: 'success',
      data: {
        webhookUrl: `https://api.sabagapulse.com/v1/webhooks/wf_init_abc123`
      }
    },
    {
      id: 'step-2',
      type: 'action',
      icon: 'FlaskConical',
      title: 'Generate Welcome Email',
      description: 'AI-powered content generation',
      content: {
          code: 'function generateEmail(username) {\n  // ...\n}',
          language: 'typescript'
      },
      status: 'success',
    },
    {
      id: 'step-3',
      type: 'action',
      icon: 'Mail',
      title: 'Send Email',
      description: 'via SendGrid',
      status: 'error',
      errorMessage: {
        title: 'Error: SMTP connection failed',
        description: 'Could not connect to SendGrid API.'
      }
    },
];
