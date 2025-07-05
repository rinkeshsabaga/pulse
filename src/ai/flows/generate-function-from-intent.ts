// src/ai/flows/generate-function-from-intent.ts
'use server';
/**
 * @fileOverview An AI agent that generates a function from a user's intent.
 *
 * - generateFunctionFromIntent - A function that generates a function from a user's intent.
 * - GenerateFunctionFromIntentInput - The input type for the generateFunctionFromIntent function.
 * - GenerateFunctionFromIntentOutput - The return type for the generateFunctionFromIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFunctionFromIntentInputSchema = z.object({
  intent: z.string().describe('The intent of the function to be generated.'),
  language: z.enum(['typescript', 'python', 'javascript']).default('typescript').describe('The programming language for the generated function. Defaults to typescript.'),
});
export type GenerateFunctionFromIntentInput = z.infer<typeof GenerateFunctionFromIntentInputSchema>;

const GenerateFunctionFromIntentOutputSchema = z.object({
  functionCode: z.string().describe('The generated function code.'),
});
export type GenerateFunctionFromIntentOutput = z.infer<typeof GenerateFunctionFromIntentOutputSchema>;

export async function generateFunctionFromIntent(input: GenerateFunctionFromIntentInput): Promise<GenerateFunctionFromIntentOutput> {
  return generateFunctionFromIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFunctionFromIntentPrompt',
  input: {schema: GenerateFunctionFromIntentInputSchema},
  output: {schema: GenerateFunctionFromIntentOutputSchema},
  prompt: `You are an AI code generator. You will generate a function based on the user's intent.

  Intent: {{{intent}}}

  Language: {{{language}}}

  Please provide only the function code, without any explanations or comments, unless the intent asks for comments.
  Ensure proper syntax and formatting for the specified language.
  `, // Ensure that generated code is well-formed
});

const generateFunctionFromIntentFlow = ai.defineFlow(
  {
    name: 'generateFunctionFromIntentFlow',
    inputSchema: GenerateFunctionFromIntentInputSchema,
    outputSchema: GenerateFunctionFromIntentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
