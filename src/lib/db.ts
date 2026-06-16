import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { assertValidServerEnv } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Client Singleton (Prisma 7 with PgBouncer adapter)
//
// Uses the pooled DATABASE_URL (PgBouncer) at runtime — required for Vercel/
// serverless environments. The adapter handles connection pooling efficiently.
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  assertValidServerEnv();
  const databaseUrl = process.env.DATABASE_URL!;

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 10_000,
      timeout: 15_000,
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
