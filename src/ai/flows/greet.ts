'use server';
/**
 * @fileOverview A simple greeting flow.
 *
 * - greet - A function that returns a greeting for a given name.
 * - GreetInput - The input type for the greet function.
 * - GreetOutput - The return type for the greet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GreetInputSchema = z.object({
  name: z.string().describe('The name to greet.'),
});
export type GreetInput = z.infer<typeof GreetInputSchema>;

const GreetOutputSchema = z.object({
  greeting: z.string().describe('The generated greeting.'),
});
export type GreetOutput = z.infer<typeof GreetOutputSchema>;

export async function greet(input: GreetInput): Promise<GreetOutput> {
  return greetFlow(input);
}

const greetPrompt = ai.definePrompt({
  name: 'greetPrompt',
  input: {schema: GreetInputSchema},
  output: {schema: GreetOutputSchema},
  prompt: `You are a friendly greeter. Your goal is to generate a warm and friendly greeting for the given name.

  Name: {{{name}}}
  `,
});

const greetFlow = ai.defineFlow(
  {
    name: 'greetFlow',
    inputSchema: GreetInputSchema,
    outputSchema: GreetOutputSchema,
  },
  async input => {
    const {output} = await greetPrompt(input);
    return output!;
  }
);
