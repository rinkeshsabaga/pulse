'use server';

import { db } from '@/lib/db';
import { getAuthContext, requireRole } from '@/lib/auth';
import { encryptObject, decryptObject } from '@/lib/encryption';
import type { CredentialType } from '@prisma/client';
import { deleteConnection } from '@/lib/nango';
import { getNangoIntegrationKey } from '@/lib/nango-config';

// ─────────────────────────────────────────────────────────────────────────────
// Credential Service
// All secrets are encrypted with AES-256-GCM before hitting the database.
// ─────────────────────────────────────────────────────────────────────────────

export type CredentialInput = {
  appName: string;
  accountName: string;
  type: CredentialType;
  authData: {
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
    connectionString?: string;
  };
  nangoConnectionId?: string;
};

export type CredentialPublic = {
  id: string;
  organizationId: string;
  appName: string;
  accountName: string;
  type: CredentialType;
  nangoConnectionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // authData is intentionally omitted from public view
};

export async function getCredentials(): Promise<CredentialPublic[]> {
  const { dbOrgId } = await getAuthContext();

  return db.credential.findMany({
    where: { organizationId: dbOrgId },
    select: {
      id: true,
      organizationId: true,
      appName: true,
      accountName: true,
      type: true,
      nangoConnectionId: true,
      createdAt: true,
      updatedAt: true,
      // encryptedData intentionally excluded
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCredentialById(id: string): Promise<CredentialPublic | null> {
  const { dbOrgId } = await getAuthContext();

  return db.credential.findFirst({
    where: { id, organizationId: dbOrgId },
    select: {
      id: true,
      organizationId: true,
      appName: true,
      accountName: true,
      type: true,
      nangoConnectionId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Returns decrypted auth data. Only for server-side use (e.g., workflow execution).
 * Never expose to the client.
 */
export async function getCredentialSecrets(id: string, orgId: string): Promise<Record<string, unknown>> {
  const credential = await db.credential.findFirst({
    where: { id, organizationId: orgId },
    select: { encryptedData: true },
  });

  if (!credential) throw new Error('Credential not found');
  return decryptObject(credential.encryptedData);
}

export async function createCredential(input: CredentialInput): Promise<CredentialPublic> {
  const { dbOrgId, userId } = await getAuthContext();

  const authData = cleanAuthData(input.authData);
  validateCredentialSecrets(input.type, authData, input.nangoConnectionId);
  const encryptedData = encryptObject(authData);

  const credential = await db.$transaction(async (tx) => {
    const cred = await tx.credential.create({
      data: {
        organizationId: dbOrgId,
        appName: input.appName,
        accountName: input.accountName,
        type: input.type,
        encryptedData,
        nangoConnectionId: input.nangoConnectionId ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: 'credential.create',
        resourceType: 'credential',
        resourceId: cred.id,
        metadata: { appName: input.appName, accountName: input.accountName },
      },
    });

    return cred;
  });

  return {
    id: credential.id,
    organizationId: credential.organizationId,
    appName: credential.appName,
    accountName: credential.accountName,
    type: credential.type,
    nangoConnectionId: credential.nangoConnectionId,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

export async function updateCredential(id: string, input: Partial<CredentialInput>): Promise<CredentialPublic> {
  const { dbOrgId, userId } = await getAuthContext();

  // Verify ownership
  const existing = await db.credential.findFirst({ where: { id, organizationId: dbOrgId } });
  if (!existing) throw new Error('Credential not found');
  if (input.type && input.type !== existing.type) {
    throw new Error('Credential authentication type cannot be changed. Create a new credential instead.');
  }
  if (existing.type === 'OAUTH' && input.appName && input.appName !== existing.appName) {
    throw new Error('The application for an OAuth connection cannot be changed.');
  }

  const updateData: Record<string, unknown> = {};
  if (input.appName) updateData.appName = input.appName;
  if (input.accountName) updateData.accountName = input.accountName;
  if (input.type) updateData.type = input.type;
  if (input.nangoConnectionId !== undefined) updateData.nangoConnectionId = input.nangoConnectionId;
  if (input.authData) {
    const currentAuthData = decryptObject<Record<string, unknown>>(existing.encryptedData);
    const nextAuthData = {
      ...currentAuthData,
      ...cleanAuthData(input.authData),
    };
    validateCredentialSecrets(existing.type, nextAuthData, input.nangoConnectionId ?? existing.nangoConnectionId ?? undefined);
    updateData.encryptedData = encryptObject(nextAuthData);
  }

  const credential = await db.$transaction(async (tx) => {
    const cred = await tx.credential.update({
      where: { id },
      data: updateData,
    });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: 'credential.update',
        resourceType: 'credential',
        resourceId: id,
      },
    });

    return cred;
  });

  return {
    id: credential.id,
    organizationId: credential.organizationId,
    appName: credential.appName,
    accountName: credential.accountName,
    type: credential.type,
    nangoConnectionId: credential.nangoConnectionId,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

export async function deleteCredential(id: string): Promise<{ success: boolean }> {
  const { dbOrgId, userId } = await requireRole('ADMIN');

  const existing = await db.credential.findFirst({ where: { id, organizationId: dbOrgId } });
  if (!existing) return { success: false };

  if (existing.type === 'OAUTH' && existing.nangoConnectionId) {
    const providerConfigKey = getNangoIntegrationKey(existing.appName);
    if (!providerConfigKey) {
      throw new Error(`OAuth provider mapping is missing for ${existing.appName}.`);
    }
    try {
      await deleteConnection(existing.nangoConnectionId, providerConfigKey);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw new Error(`Could not revoke the ${existing.appName} OAuth connection. Try again.`);
      }
    }
  }

  await db.$transaction(async (tx) => {
    await tx.credential.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        organizationId: dbOrgId,
        clerkUserId: userId,
        action: 'credential.delete',
        resourceType: 'credential',
        resourceId: id,
        metadata: { appName: existing.appName, accountName: existing.accountName },
      },
    });
  });

  return { success: true };
}

function cleanAuthData(authData: CredentialInput['authData']): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(authData).filter(([, value]) => typeof value !== 'string' || value.trim() !== '')
  );
}

function validateCredentialSecrets(
  type: CredentialType,
  authData: Record<string, unknown>,
  nangoConnectionId?: string
) {
  const hasString = (key: string) => typeof authData[key] === 'string' && String(authData[key]).trim().length > 0;

  if (type === 'API_KEY' && !hasString('apiKey')) throw new Error('API key is required.');
  if (type === 'DATABASE_URL' && !hasString('connectionString')) throw new Error('Database connection string is required.');
  if (type === 'BASIC_AUTH' && (!hasString('username') || !hasString('password'))) {
    throw new Error('Username and password are required.');
  }
  if (type === 'OAUTH' && !nangoConnectionId) throw new Error('OAuth connection ID is required.');
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 404;
}
