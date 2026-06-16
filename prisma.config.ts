import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// Load .env.local for CLI commands (Next.js does this automatically for the app)
config({ path: '.env.local' });

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Config (Prisma 7+)
//
// For migrations / db push: uses DIRECT_URL (direct Supabase connection, port 5432)
// For runtime (Next.js app): uses DATABASE_URL (PgBouncer pooled, port 6543)
// ─────────────────────────────────────────────────────────────────────────────

const directUrl = process.env.DIRECT_URL;
const appUrl = process.env.DATABASE_URL;

if (!directUrl && !appUrl) {
  throw new Error('Neither DIRECT_URL nor DATABASE_URL is set in .env.local');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',

  datasource: {
    url: directUrl || appUrl,
  },
});
