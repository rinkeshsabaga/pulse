import { config } from 'dotenv';
import { validateServerEnv } from '../src/lib/env';

config({ path: '.env.local' });

const result = validateServerEnv(process.env, {
  includeOptional: true,
  strictPlaceholders: process.env.STRICT_ENV_VALIDATION === 'true',
});

for (const warning of result.warnings) {
  console.warn(`[env] ${warning}`);
}

if (!result.valid) {
  console.error(result.errors.map((error) => `[env] ${error}`).join('\n'));
  process.exit(1);
}

console.log('[env] Required environment variables are valid.');

