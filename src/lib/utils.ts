
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves a dot-notation path from an object.
 * @param obj The object to resolve the path from.
 * @param path The dot-notation path (e.g., 'trigger.body.user.id').
 * @returns The value at the specified path, or an empty string if not found.
 */
export function resolvePath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

/**
 * Replaces placeholders like {{variable.path}} in a string with their resolved values.
 * @param templateString The string containing placeholders.
 * @param context The data object to resolve paths from.
 * @returns The string with placeholders replaced.
 */
export function resolveVariables(templateString: string, context: Record<string, any>): string {
  if (!templateString) return '';
  return templateString.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = resolvePath(context, path.trim());
    if (value === undefined || value === null) {
        return match; // Keep placeholder if value not found
    }
    // If the resolved value is an object or array, stringify it
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
  });
}
