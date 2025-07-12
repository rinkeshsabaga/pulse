'use server';
/**
 * @fileOverview A flow to handle sending emails.
 *
 * - sendEmail - A function that handles sending an email.
 * - SendEmailInput - The input type for the sendEmail function.
 * - SendEmailOutput - The return type for the sendEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SendEmailInputSchema = z.object({
  to: z.string().email().describe('The recipient email address.'),
  from: z.string().email().describe('The sender email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body content of the email (can be HTML).'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export const SendEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  messageId: z.string().describe('The unique ID of the sent email.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;


const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async (input) => {
    // In a real application, you would integrate with an email service
    // like SendGrid, Resend, or AWS SES here.
    console.log('--- SIMULATING EMAIL SEND ---');
    console.log('To:', input.to);
    console.log('From:', input.from);
    console.log('Subject:', input.subject);
    console.log('Body:', input.body);
    console.log('-----------------------------');

    // For this prototype, we'll just return a mock success response.
    return {
      success: true,
      messageId: `mock-message-${Date.now()}`,
    };
  }
);

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return sendEmailFlow(input);
}
