import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely resolves a dot-notation path from a nested object.
 * @param obj The object to resolve the path from.
 * @param path The dot-notation path string (e.g., 'trigger.body.name').
 * @returns The value at the specified path, or undefined if not found.
 */
function resolvePath(obj: Record<string, any>, path: string): any {
  if (!path) return undefined;
  const properties = path.split('.');
  return properties.reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
}

/**
 * Replaces mustache-style placeholders in a string with values from a data context.
 * @param template The string with placeholders (e.g., "Hello {{user.name}}").
 * @param context The data object to resolve values from.
 * @returns The string with placeholders replaced.
 */
export function resolveVariables(template: string, context: Record<string, any>): string {
    if (!template || typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = resolvePath(context, path.trim());
        if (value === undefined) {
            return match; // Return original placeholder if value not found
        }
        if (value === null) {
          return 'null';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    });
}
