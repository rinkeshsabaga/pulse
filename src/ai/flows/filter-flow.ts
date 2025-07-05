'use server';
/**
 * @fileOverview A flow to evaluate conditions and branch workflows.
 *
 * - filter - A function that evaluates a set of conditions against a data context.
 * - FilterInput - The input type for the filter function.
 * - FilterOutput - The return type for the filter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FilterConditionSchema = z.object({
  id: z.string(),
  variable: z.string().describe("The variable from the context to check, e.g., 'trigger.data.name'."),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'greater_than', 'less_than']),
  value: z.string().describe("The value to compare against."),
});
type FilterCondition = z.infer<typeof FilterConditionSchema>;

export const FilterInputSchema = z.object({
  conditions: z.array(FilterConditionSchema),
  logicalOperator: z.enum(['AND', 'OR']),
  dataContext: z.record(z.any()).describe('The data context from previous steps to evaluate against.'),
});
export type FilterInput = z.infer<typeof FilterInputSchema>;

export const FilterOutputSchema = z.object({
  match: z.boolean().describe('Whether the data matches the filter conditions.'),
});
export type FilterOutput = z.infer<typeof FilterOutputSchema>;

/**
 * Safely resolves a dot-notation path from a nested object.
 * @param obj The object to resolve the path from.
 * @param path The dot-notation path string (e.g., 'trigger.body.name').
 * @returns The value at the specified path, or undefined if not found.
 */
function resolvePath(obj: Record<string, any>, path: string): any {
  if (!path) return undefined;
  const properties = path.split('.');
  return properties.reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
}

/**
 * Evaluates a single filter condition against the data context.
 * @param condition The condition to evaluate.
 * @param dataContext The data context.
 * @returns True if the condition is met, false otherwise.
 */
function evaluateCondition(condition: FilterCondition, dataContext: Record<string, any>): boolean {
    const actualValue = resolvePath(dataContext, condition.variable);
    const expectedValue = condition.value;

    switch (condition.operator) {
        case 'is_empty':
            return actualValue === null || actualValue === undefined || actualValue === '';
        case 'is_not_empty':
            return actualValue !== null && actualValue !== undefined && actualValue !== '';
    }

    if (actualValue === null || actualValue === undefined) {
        return false;
    }

    if (condition.operator === 'greater_than' || condition.operator === 'less_than') {
        const numActual = parseFloat(String(actualValue));
        const numExpected = parseFloat(expectedValue);
        
        if (!isNaN(numActual) && !isNaN(numExpected)) {
            if (condition.operator === 'greater_than') return numActual > numExpected;
            if (condition.operator === 'less_than') return numActual < numExpected;
        } else {
            return false;
        }
    }
    
    const actualValueStr = String(actualValue);

    switch (condition.operator) {
        case 'equals':
            return actualValueStr === expectedValue;
        case 'not_equals':
            return actualValueStr !== expectedValue;
        case 'contains':
            return actualValueStr.includes(expectedValue);
        case 'not_contains':
            return !actualValueStr.includes(expectedValue);
        case 'starts_with':
            return actualValueStr.startsWith(expectedValue);
        case 'ends_with':
            return actualValueStr.endsWith(expectedValue);
        default:
            return false;
    }
}


const filterFlow = ai.defineFlow(
  {
    name: 'filterFlow',
    inputSchema: FilterInputSchema,
    outputSchema: FilterOutputSchema,
  },
  async (input) => {
    if (!input.conditions || input.conditions.length === 0) {
        return { match: true }; // No conditions means it passes.
    }
    
    // In a real application, the dataContext would be the combined output
    // of all previous steps in the workflow. For this prototype, it's passed directly.
    console.log('Evaluating filter with data context:', input.dataContext);

    const conditionResults = input.conditions.map(condition =>
      evaluateCondition(condition, input.dataContext)
    );
    
    let match = false;
    if (input.logicalOperator === 'AND') {
      match = conditionResults.every(result => result);
    } else { // OR
      match = conditionResults.some(result => result);
    }

    console.log(`Filter result (${input.logicalOperator}): ${match}`);
    return { match };
  }
);

export async function filter(input: FilterInput): Promise<FilterOutput> {
  return filterFlow(input);
}
