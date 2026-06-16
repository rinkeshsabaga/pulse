import type { WorkflowStepData } from '@/lib/types';

export function workflowGraphsEqual(
  left: WorkflowStepData[] | unknown,
  right: WorkflowStepData[] | unknown
): boolean {
  return stableStringify(left ?? []) === stableStringify(right ?? []);
}

export function dedupeVersionsByNumber<T extends { version: number }>(versions: T[]): T[] {
  const unique = new Map<number, T>();
  for (const version of versions) {
    if (!unique.has(version.version)) unique.set(version.version, version);
  }
  return [...unique.values()].sort((a, b) => b.version - a.version);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortValue(item)])
  );
}
