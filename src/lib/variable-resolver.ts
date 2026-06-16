// ─────────────────────────────────────────────────────────────────────────────
// Variable Resolver
// Resolves {{variable.path}} template strings against a data context.
// Supports nested paths: {{trigger.body.email}}, {{step_id.output.id}}, etc.
// ─────────────────────────────────────────────────────────────────────────────

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Resolves all {{variable.path}} placeholders in a string using the context object.
 *
 * @example
 * resolveVariables("Hello {{trigger.body.name}}", { trigger: { body: { name: "Alice" } } })
 * // => "Hello Alice"
 */
export function resolveVariables(template: string, context: Record<string, unknown>): string {
  if (!template || !template.includes('{{')) return template;

  return template.replace(VARIABLE_REGEX, (match, path) => {
    const value = getNestedValue(context, path.trim());
    if (value === undefined || value === null) return match; // Keep placeholder if not found
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Resolves variables in all string values within an object (deep).
 */
export function resolveObjectVariables<T extends Record<string, unknown>>(
  obj: T,
  context: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = resolveVariables(value, context);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = resolveObjectVariables(value as Record<string, unknown>, context);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? resolveObjectVariables(item as Record<string, unknown>, context)
          : typeof item === 'string'
          ? resolveVariables(item, context)
          : item
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Lists all variable placeholders in a template string.
 * Useful for the UI to show what variables are referenced.
 */
export function extractVariables(template: string): string[] {
  const matches: string[] = [];
  let match;
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  while ((match = regex.exec(template)) !== null) {
    matches.push(match[1].trim());
  }
  return [...new Set(matches)];
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, obj);
}
