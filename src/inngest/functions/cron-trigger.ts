import { inngest } from '../client';
import { db } from '@/lib/db';
import cronParser from 'cron-parser';
import { checkWorkflowRunEntitlement } from '@/services/usage';
import type { WorkflowStepData } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Global Cron Scheduler
// Runs every minute to evaluate workflows with Cron triggers.
// ─────────────────────────────────────────────────────────────────────────────

export const evaluateCronTriggers = inngest.createFunction(
  {
    id: 'evaluate-cron-triggers',
    triggers: [{ cron: '* * * * *' }],
  },
  async ({ step }) => {
    // 1. Fetch all published workflows
    const workflows = await step.run('fetch-published-workflows', async () => {
      return db.workflow.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, organizationId: true, steps: true, name: true },
      });
    });

    const now = new Date();
    // Normalize to the start of the current minute
    const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

    const workflowsToRun: { workflowId: string; organizationId: string; steps: WorkflowStepData[] }[] = [];

    // 2. Evaluate cron expressions
    await step.run('evaluate-schedules', async () => {
      for (const wf of workflows) {
        const steps = wf.steps as any[];
        if (!steps || steps.length === 0) continue;

        const firstStep = steps[0];
        if (firstStep.type === 'trigger' && firstStep.title === 'Cron Job') {
          const cronString = firstStep.data?.cronString;
          if (!cronString) continue;

          try {
            const interval = cronParser.parseExpression(cronString, {
              currentDate: new Date(currentMinute.getTime() - 60000), // Start from previous minute
              iterator: true,
            });

            // Get next execution time
            const nextExecution = interval.next().value;
            const nextExecutionDate = nextExecution.toDate();

            // Compare ignoring seconds/milliseconds
            const nextMinute = new Date(nextExecutionDate.getFullYear(), nextExecutionDate.getMonth(), nextExecutionDate.getDate(), nextExecutionDate.getHours(), nextExecutionDate.getMinutes());

            if (nextMinute.getTime() === currentMinute.getTime()) {
              workflowsToRun.push({
                workflowId: wf.id,
                organizationId: wf.organizationId,
                steps: steps as WorkflowStepData[],
              });
            }
          } catch (err) {
            console.error(`Invalid cron string for workflow ${wf.id}: ${cronString}`);
          }
        }
      }
    });

    // 3. Trigger workflow runs
    if (workflowsToRun.length > 0) {
      await step.run('trigger-workflows', async () => {
        // We'll dispatch events individually to check limits and avoid partial failures
        for (const wf of workflowsToRun) {
          try {
            await checkWorkflowRunEntitlement(wf.organizationId, wf.steps);
            await inngest.send({
              name: 'workflow/run',
              data: {
                workflowId: wf.workflowId,
                organizationId: wf.organizationId,
                trigger: 'cron',
                triggerData: { scheduledFor: currentMinute.toISOString() },
              },
            });
          } catch (error) {
             console.error(`Skipping cron run for workflow ${wf.workflowId}: ${(error as Error).message}`);
          }
        }
      });
    }

    return { evaluated: workflows.length, triggered: workflowsToRun.length };
  }
);
