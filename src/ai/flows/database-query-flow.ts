
'use server';
/**
 * @fileOverview A flow to handle running database queries.
 *
 * - databaseQuery - A function that handles running a database query.
 * - DatabaseQueryInput - The input type for the databaseQuery function.
 * @exports databaseQuery - The function to execute a database query.
 * @exports DatabaseQueryInput - The input type for the function.
 * @exports DatabaseQueryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { getCredentialById } from '@/lib/db';
import { resolveVariables } from '@/lib/utils';
import { DatabaseQueryInputSchema, DatabaseQueryOutputSchema, type DatabaseQueryInput, type DatabaseQueryOutput } from '@/lib/types';


const databaseQueryFlow = ai.defineFlow(
  {
    name: 'databaseQueryFlow',
    inputSchema: DatabaseQueryInputSchema,
    outputSchema: DatabaseQueryOutputSchema,
  },
  async (input) => {
    // In a real application, you would use the credential to connect to the database.
    const credential = await getCredentialById(input.credentialId);
    if (!credential) {
      console.error(`Credential with ID ${input.credentialId} not found.`);
      return {
        success: false,
        rows: [],
        error: 'Database credential not found.',
      };
    }

    const resolvedQuery = resolveVariables(input.query, input.dataContext || {});

    console.log('--- SIMULATING DATABASE QUERY ---');
    console.log('Connecting with:', credential.appName, `(${credential.accountName})`);
    console.log('Executing Query:', resolvedQuery);
    console.log('---------------------------------');

    // Simulate different results based on the query.
    let mockRows = [];
    if (/select.*from.*users/i.test(resolvedQuery)) {
        mockRows = [
            { id: 1, name: 'Alice', email: 'alice@example.com', signup_date: '2023-01-15' },
            { id: 2, name: 'Bob', email: 'bob@example.com', signup_date: '2023-02-20' },
            { id: 3, name: 'Charlie', email: 'charlie@example.com', signup_date: '2023-03-10' },
        ];
    } else if (/select.*from.*orders/i.test(resolvedQuery)) {
         mockRows = [
            { order_id: 'ord_123', user_id: 1, amount: 99.99, date: '2024-05-01' },
            { order_id: 'ord_124', user_id: 2, amount: 49.50, date: '2024-05-02' },
            { order_id: 'ord_125', user_id: 1, amount: 120.00, date: '2024-05-03' },
        ];
    } else {
        mockRows = [
            { result: 'Query executed successfully.', details: 'This is mock data as the query was not recognized.' },
        ];
    }

    return {
      success: true,
      rows: mockRows,
    };
  }
);

export async function databaseQuery(input: DatabaseQueryInput): Promise<DatabaseQueryOutput> {
  return databaseQueryFlow(input);
}
