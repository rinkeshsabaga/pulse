import { Inngest } from 'inngest';

// ─────────────────────────────────────────────────────────────────────────────
// Inngest Client
// Shared across all function definitions and the API route handler.
// ─────────────────────────────────────────────────────────────────────────────

export const inngest = new Inngest({
  id: 'sabaga-pulse',
  name: 'SabagaPulse',
});

// ─── Event Type Definitions ───────────────────────────────────────────────────

export type WorkflowRunEvent = {
  name: 'workflow/run';
  data: {
    workflowId: string;
    organizationId: string;         // Prisma Organization.id
    trigger: 'manual' | 'webhook' | 'cron' | 'api';
    triggerData?: Record<string, unknown>;
    runId?: string;                 // Pre-created WorkflowRun.id (optional)
  };
};

export type WorkflowScheduleEvent = {
  name: 'workflow/schedule';
  data: {
    workflowId: string;
    organizationId: string;
    cronString: string;
  };
};

export type Events = WorkflowRunEvent | WorkflowScheduleEvent;
