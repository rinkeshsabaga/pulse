
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
    let dataContext: Record<string, any> = {};

    console.log(`--- Starting Workflow Execution ---`);

    // Initialize context with trigger data, if available
    const triggerStep = steps.find(s => s.type === 'trigger');
    if (triggerStep?.data?.selectedEventId && triggerStep?.data?.events) {
        const selectedEvent = triggerStep.data.events.find(e => e.id === triggerStep.data.selectedEventId);
        if (selectedEvent) {
            dataContext['trigger'] = selectedEvent;
        }
    } else {
        dataContext['trigger'] = { body: { note: 'No trigger event selected, using empty context.' } };
    }
    
    // Process steps sequentially
    for (const step of steps) {
      if (step.type === 'trigger') continue; // Skip trigger, already processed
      
      console.log(`Executing step: ${step.title} (ID: ${step.id})`);

      try {
        let stepOutput: any = null;
        switch(step.title) {
            case 'Wait':
                if (step.data) {
                    stepOutput = await wait(step.data);
                }
                break;
            case 'Condition':
                if (step.data?.conditionData) {
                    const result = await condition({ cases: step.data.conditionData.cases, dataContext });
                    // This is a special case, we don't add to context but it can alter flow
                    // For now, we just log it. A real engine would handle branching here.
                    console.log(`Condition result: ${result.outcome}`);
                    stepOutput = result;
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
                break;
            case 'Database Query':
                 if (step.data?.databaseQueryData) {
                    stepOutput = await databaseQuery({
                        credentialId: step.data.databaseQueryData.credentialId || '',
                        query: step.data.databaseQueryData.query || '',
                        dataContext,
                    });
                }
                break;
            // TODO: Implement other action types like API Request, Custom Code, etc.
            default:
                console.log(`Skipping step "${step.title}" - execution logic not implemented.`);
                stepOutput = { note: `Execution for ${step.title} is not implemented.` };
                break;
        }
        
        // Add step output to the data context for subsequent steps
        if (stepOutput) {
            dataContext[step.id] = stepOutput;
        }

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
