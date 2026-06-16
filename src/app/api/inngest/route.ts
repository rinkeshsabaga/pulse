import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { runWorkflowFunction } from '@/inngest/functions/run-workflow';
import { evaluateCronTriggers } from '@/inngest/functions/cron-trigger';

// ─────────────────────────────────────────────────────────────────────────────
// Inngest API Route Handler
// This endpoint receives function calls from Inngest's servers.
// Register all Inngest functions here.
// ─────────────────────────────────────────────────────────────────────────────

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runWorkflowFunction,
    evaluateCronTriggers,
  ],
});
