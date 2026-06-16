import type { RunStatus } from '@prisma/client';

export type RunSeriesPoint = {
  date: string;
  runs: number;
  successful: number;
  failed: number;
  other: number;
};

export function buildRunSeries(
  runs: Array<{ startedAt: Date; status: RunStatus }>,
  days: number,
  now = new Date()
): RunSeriesPoint[] {
  const safeDays = Math.max(1, Math.floor(days));
  const points = new Map<string, RunSeriesPoint>();

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    points.set(key, { date: key, runs: 0, successful: 0, failed: 0, other: 0 });
  }

  for (const run of runs) {
    const point = points.get(run.startedAt.toISOString().slice(0, 10));
    if (!point) continue;
    point.runs += 1;
    if (run.status === 'SUCCESS') point.successful += 1;
    else if (run.status === 'FAILED' || run.status === 'TIMED_OUT') point.failed += 1;
    else point.other += 1;
  }

  return [...points.values()];
}
