import { Nango } from '@nangohq/node';
import { getFeatureEnv } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Nango Client — Handles OAuth for all app integrations
// ─────────────────────────────────────────────────────────────────────────────

let nangoClient: Nango | null = null;

export function getNangoClient(): Nango {
  if (nangoClient) return nangoClient;
  nangoClient = new Nango({
    secretKey: getFeatureEnv('NANGO_SECRET_KEY', 'Nango OAuth'),
  });
  return nangoClient;
}

/**
 * Retrieves a fresh access token for a connection.
 * Nango handles token refresh automatically.
 */
export async function getAccessToken(
  connectionId: string,
  providerConfigKey: string
): Promise<string> {
  const connection = await getNangoClient().getConnection(providerConfigKey, connectionId);
  const credentials = connection.credentials;
  const token = credentials && 'access_token' in credentials
    ? credentials.access_token
    : undefined;
  if (!token) throw new Error(`No access token for connection ${connectionId}`);
  return token;
}

/**
 * Gets the raw connection object (for OAuth metadata, expiry, etc.)
 */
export async function getConnection(connectionId: string, providerConfigKey: string) {
  return getNangoClient().getConnection(providerConfigKey, connectionId);
}

/**
 * Deletes a Nango connection (called when credential is deleted).
 */
export async function deleteConnection(connectionId: string, providerConfigKey: string) {
  return getNangoClient().deleteConnection(providerConfigKey, connectionId);
}

// ─── Integration Keys ─────────────────────────────────────────────────────────
export * from './nango-config';
