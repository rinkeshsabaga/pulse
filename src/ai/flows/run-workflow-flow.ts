
'use server';
/**
 * @fileOverview A flow to execute a complete workflow from steps.
 *
 * - runWorkflow - A function that orchestrates the execution of workflow steps.
 * - RunWorkflowInput - The input type for the runWorkflow function.
 * - RunWorkflowOutput - The return type for the runWorkflow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { WorkflowStepData } from '@/lib/types';
import { condition } from './condition-flow';
import { wait } from './wait-flow';
import { sendEmail } from './send-email-flow';
import { databaseQuery } from './database-query-flow';
import { resolveVariables } from '@/lib/utils';
import { RunWorkflowInputSchema, RunWorkflowOutputSchema, type RunWorkflowInput, type RunWorkflowOutput } from '@/lib/types';


const runWorkflowFlow = ai.defineFlow(
  {
    name: 'runWorkflowFlow',
    inputSchema: RunWorkflowInputSchema,
    outputSchema: RunWorkflowOutputSchema,
  },
  async (input) => {
    const steps = input.steps as WorkflowStepData[];
    const stepMap = new Map(steps.map(step => [step.id, step]));
    let dataContext: Record<string, any> = {};
    let currentStepId: string | undefined;

    console.log(`--- Starting Workflow Execution ---`);

    // Find the trigger step to start
    const triggerStep = steps.find(s => s.type === 'trigger');
    if (!triggerStep) {
        return {
            success: false,
            message: 'Workflow has no trigger step.',
            finalDataContext: dataContext,
        };
    }
    
    currentStepId = triggerStep.id;

    if (triggerStep?.data?.selectedEventId && triggerStep?.data?.events) {
        const selectedEvent = triggerStep.data.events.find(e => e.id === triggerStep.data.selectedEventId);
        if (selectedEvent) {
            dataContext['trigger'] = selectedEvent;
        }
    } else {
        dataContext['trigger'] = { body: { note: 'No trigger event selected, using empty context.' } };
    }
     if (triggerStep) {
        dataContext[triggerStep.id] = { ...dataContext.trigger };
     }


    // Process steps by following the chain
    while(currentStepId) {
      const step = stepMap.get(currentStepId);
      if (!step) {
          console.error(`Step with ID ${currentStepId} not found. Halting execution.`);
          break;
      }
      
      console.log(`Executing step: ${step.title} (ID: ${step.id})`);

      try {
        let stepOutput: any = null;
        let nextStepId: string | undefined;

        switch(step.title) {
            case 'Wait':
                if (step.data) {
                    stepOutput = await wait(step.data);
                }
                nextStepId = step.data?.nextStepId;
                break;
            case 'Condition':
                if (step.data?.conditionData) {
                    const result = await condition({ cases: step.data.conditionData.cases, dataContext });
                    const matchedCase = step.data.conditionData.cases.find(c => c.name === result.outcome);

                    if (matchedCase && matchedCase.nextStepId) {
                        nextStepId = matchedCase.nextStepId;
                    } else {
                        nextStepId = step.data.conditionData.defaultNextStepId;
                    }
                    console.log(`Condition result: ${result.outcome}, next step: ${nextStepId}`);
                    stepOutput = result;
                } else {
                    nextStepId = step.data?.nextStepId;
                }
                break;
            case 'Send Email':
                 if (step.data?.emailData) {
                    const resolvedInput = {
                        to: resolveVariables(step.data.emailData.to || '', dataContext),
                        from: resolveVariables(step.data.emailData.from || '', dataContext),
                        subject: resolveVariables(step.data.emailData.subject || '', dataContext),
                        body: resolveVariables(step.data.emailData.body || '', dataContext),
                    };
                    if (!resolvedInput.to) {
                        console.warn(`Skipping "Send Email" step ${step.id} because 'To' address is empty.`);
                        stepOutput = { success: false, note: `Skipped: 'To' address was empty.` };
                    } else {
                        stepOutput = await sendEmail(resolvedInput);
                    }
                }
                nextStepId = step.data?.nextStepId;
                break;
            case 'Database Query':
                 if (step.data?.databaseQueryData) {
                    stepOutput = await databaseQuery({
                        credentialId: step.data.databaseQueryData.credentialId || '',
                        query: step.data.databaseQueryData.query || '',
                        dataContext,
                    });
                }
                nextStepId = step.data?.nextStepId;
                break;
            // Handle trigger as a non-action step
            case 'Webhook':
            case 'Cron Job':
            case 'Shopify':
            case 'App Event':
                nextStepId = step.data?.nextStepId;
                // No output for triggers during run, context is already set
                break;
            default:
                console.log(`Skipping step "${step.title}" - execution logic not implemented.`);
                stepOutput = { note: `Execution for ${step.title} is not implemented.` };
                nextStepId = step.data?.nextStepId;
                break;
        }
        
        // Add step output to the data context for subsequent steps
        if (stepOutput) {
            dataContext[step.id] = stepOutput;
        }
        
        currentStepId = nextStepId;

      } catch (error: any) {
        console.error(`Error executing step ${step.id}:`, error);
        return {
            success: false,
            message: `Workflow failed at step: ${step.title}. Reason: ${error.message}`,
            finalDataContext: dataContext
        }
      }
    }
    
    console.log(`--- Workflow Execution Finished ---`);

    return {
        success: true,
        message: 'Workflow executed successfully.',
        finalDataContext: dataContext
    };
  }
);

export async function runWorkflow(input: RunWorkflowInput): Promise<RunWorkflowOutput> {
  return runWorkflowFlow(input);
}
