
'use server';
/**
 * @fileOverview A flow to evaluate conditions and branch workflows.
 *
 * - condition - A function that evaluates a set of conditions against a data context.
 * - ConditionInput - The input type for the condition function.
 * - ConditionOutput - The return type for the condition function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RuleSchema = z.object({
  id: z.string(),
  variable: z.string().describe("The variable from the context to check, e.g., 'trigger.data.name'."),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'greater_than', 'less_than']),
  value: z.string().describe("The value to compare against."),
});
type Rule = z.infer<typeof RuleSchema>;

const CaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    rules: z.array(RuleSchema),
    logicalOperator: z.enum(['AND', 'OR']),
});
type Case = z.infer<typeof CaseSchema>;


export const ConditionInputSchema = z.object({
  cases: z.array(CaseSchema),
  dataContext: z.record(z.any()).describe('The data context from previous steps to evaluate against.'),
});
export type ConditionInput = z.infer<typeof ConditionInputSchema>;

export const ConditionOutputSchema = z.object({
  outcome: z.string().describe('The name of the first matching case, or "default" if none match.'),
});
export type ConditionOutput = z.infer<typeof ConditionOutputSchema>;

/**
 * Safely resolves a dot-notation path from a nested object.
 * @param obj The object to resolve the path from.
 * @param path The dot-notation path string (e.g., 'trigger.body.name').
 * @returns The value at the specified path, or undefined if not found.
 */
function resolvePath(obj: Record<string, any>, path: string): any {
  if (!path) return undefined;
  // Strip {{...}} if present
  const pathWithoutBraces = path.replace(/^{{|}}$/g, '').trim();
  const properties = pathWithoutBraces.split('.');
  return properties.reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
}

/**
 * Evaluates a single rule against the data context.
 * @param rule The rule to evaluate.
 * @param dataContext The data context.
 * @returns True if the rule is met, false otherwise.
 */
function evaluateSingleRule(rule: Rule, dataContext: Record<string, any>): boolean {
    const actualValue = resolvePath(dataContext, rule.variable);
    const expectedValue = rule.value;

    switch (rule.operator) {
        case 'is_empty':
            return actualValue === null || actualValue === undefined || actualValue === '';
        case 'is_not_empty':
            return actualValue !== null && actualValue !== undefined && actualValue !== '';
    }

    // For most operators, if the actual value is nullish, it can't be compared.
    if (actualValue === null || actualValue === undefined) {
        return false;
    }

    if (rule.operator === 'greater_than' || rule.operator === 'less_than') {
        const numActual = parseFloat(String(actualValue));
        const numExpected = parseFloat(expectedValue);
        
        if (!isNaN(numActual) && !isNaN(numExpected)) {
            if (rule.operator === 'greater_than') return numActual > numExpected;
            if (rule.operator === 'less_than') return numActual < numExpected;
        } else {
            // Can't compare non-numbers
            return false;
        }
    }
    
    const actualValueStr = String(actualValue);

    switch (rule.operator) {
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

/**
 * Evaluates a single case by checking all its rules.
 * @param caseItem The case to evaluate.
 * @param dataContext The data context.
 * @returns True if the case's conditions are met, false otherwise.
 */
function evaluateCase(caseItem: Case, dataContext: Record<string, any>): boolean {
    if (!caseItem.rules || caseItem.rules.length === 0) {
        return true; // A case with no rules always passes.
    }
    
    const ruleResults = caseItem.rules.map(rule =>
      evaluateSingleRule(rule, dataContext)
    );
    
    if (caseItem.logicalOperator === 'AND') {
      return ruleResults.every(result => result);
    } else { // OR
      return ruleResults.some(result => result);
    }
}


const conditionFlow = ai.defineFlow(
  {
    name: 'conditionFlow',
    inputSchema: ConditionInputSchema,
    outputSchema: ConditionOutputSchema,
  },
  async (input) => {
    if (!input.cases || input.cases.length === 0) {
        // No cases defined, so it can't match anything.
        return { outcome: 'default' };
    }
    
    console.log('Evaluating condition with data context:', input.dataContext);

    for (const caseItem of input.cases) {
        const isMatch = evaluateCase(caseItem, input.dataContext);
        if (isMatch) {
            console.log(`Matched case: "${caseItem.name}"`);
            return { outcome: caseItem.name };
        }
    }

    console.log(`No cases matched. Falling back to "default".`);
    return { outcome: 'default' };
  }
);

export async function condition(input: ConditionInput): Promise<ConditionOutput> {
  return conditionFlow(input);
}
