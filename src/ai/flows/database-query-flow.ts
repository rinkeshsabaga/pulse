
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
import { getCredentialById, getCredentialSecrets } from '@/services/credentials';
import { resolveVariables } from '@/lib/utils';
import { DatabaseQueryInputSchema, DatabaseQueryOutputSchema, type DatabaseQueryInput, type DatabaseQueryOutput } from '@/lib/types';
import type { PoolClient } from 'pg';


const databaseQueryFlow = ai.defineFlow(
  {
    name: 'databaseQueryFlow',
    inputSchema: DatabaseQueryInputSchema,
    outputSchema: DatabaseQueryOutputSchema,
  },
  async (input) => {
    const credential = await getCredentialById(input.credentialId);
    if (!credential || credential.type !== 'DATABASE_URL') {
      return {
        success: false,
        rows: [],
        error: 'Database credential not found.',
      };
    }

    const resolvedQuery = resolveVariables(input.query, input.dataContext || {});
    const secrets = await getCredentialSecrets(credential.id, credential.organizationId);
    const connectionString = typeof secrets.connectionString === 'string' ? secrets.connectionString : '';
    if (!connectionString) return { success: false, rows: [], error: 'Database connection URL is missing.' };

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 10_000 });
    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query('BEGIN READ ONLY');
      await client.query("SET LOCAL statement_timeout = '10s'");
      const result = await client.query(resolvedQuery);
      await client.query('ROLLBACK');
      return { success: true, rows: result.rows };
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined);
      return {
        success: false,
        rows: [],
        error: error instanceof Error ? error.message : 'Database query failed.',
      };
    } finally {
      client?.release();
      await pool.end();
    }
  }
);

export async function databaseQuery(input: DatabaseQueryInput): Promise<DatabaseQueryOutput> {
  return databaseQueryFlow(input);
}
