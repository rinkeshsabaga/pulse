type EnvValidationOptions = {
  includeOptional?: boolean;
  strictPlaceholders?: boolean;
};

type EnvValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type EnvRecord = Record<string, string | undefined>;

const REQUIRED_SERVER_ENV = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'ENCRYPTION_KEY',
] as const;

const OPTIONAL_FEATURE_ENV_GROUPS: Record<string, string[]> = {
  inngest: ['INNGEST_EVENT_KEY', 'INNGEST_SIGNING_KEY'],
  stripe: [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_STARTER_MONTHLY_PRICE_ID',
    'STRIPE_STARTER_YEARLY_PRICE_ID',
    'STRIPE_PRO_MONTHLY_PRICE_ID',
    'STRIPE_PRO_YEARLY_PRICE_ID',
  ],
  nango: ['NANGO_SECRET_KEY', 'NEXT_PUBLIC_NANGO_PUBLIC_KEY'],
  resend: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  genkit: ['GOOGLE_GENAI_API_KEY'],
};

export function validateServerEnv(
  env: EnvRecord = process.env,
  options: EnvValidationOptions = {}
): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const strictPlaceholders = options.strictPlaceholders ?? env.STRICT_ENV_VALIDATION === 'true';

  for (const name of REQUIRED_SERVER_ENV) {
    validateRequiredEnvValue(name, env[name], errors, { strictPlaceholders });
  }

  validateEncryptionKey(env.ENCRYPTION_KEY, errors);

  if (options.includeOptional) {
    for (const [feature, names] of Object.entries(OPTIONAL_FEATURE_ENV_GROUPS)) {
      const missing = names.filter((name) => !isUsableEnvValue(env[name], { strictPlaceholders }));
      if (missing.length > 0) {
        const message = `${feature} is not fully configured: ${missing.join(', ')}`;
        if (strictPlaceholders) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function assertValidServerEnv(env: EnvRecord = process.env) {
  const result = validateServerEnv(env, {
    includeOptional: env.STRICT_ENV_VALIDATION === 'true',
  });
  if (!result.valid) {
    throw new Error(`Environment validation failed:\n${result.errors.map((item) => `- ${item}`).join('\n')}`);
  }
  for (const warning of result.warnings) {
    console.warn(`[env] ${warning}`);
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!isUsableEnvValue(value, { strictPlaceholders: true })) {
    throw new Error(`${name} is not configured.`);
  }
  return value!;
}

export function getFeatureEnv(name: string, feature: string): string {
  const value = process.env[name];
  if (!isUsableEnvValue(value, { strictPlaceholders: true })) {
    throw new Error(`${feature} requires ${name} to be configured with a real value.`);
  }
  return value!;
}

function validateRequiredEnvValue(
  name: string,
  value: string | undefined,
  errors: string[],
  options: { strictPlaceholders: boolean }
) {
  if (!isUsableEnvValue(value, options)) {
    errors.push(`${name} is required.`);
  }
}

function validateEncryptionKey(value: string | undefined, errors: string[]) {
  if (!value) return;
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    errors.push('ENCRYPTION_KEY must be a 64-character hex string.');
  }
}

function isUsableEnvValue(
  value: string | undefined,
  options: { strictPlaceholders: boolean }
): boolean {
  if (!value || value.trim() === '') return false;
  if (!options.strictPlaceholders) return true;
  return !/REPLACE_ME|your-|example/i.test(value);
}
