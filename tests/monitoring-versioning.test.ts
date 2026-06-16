import assert from 'node:assert/strict';
import test from 'node:test';
import type { WorkflowStepData } from '../src/lib/types';
import { buildRunSeries } from '../src/lib/run-monitoring';
import { dedupeVersionsByNumber, workflowGraphsEqual } from '../src/lib/workflow-versioning';

const baseSteps: WorkflowStepData[] = [
  {
    id: 'trigger',
    type: 'trigger',
    icon: 'Webhook',
    title: 'Webhook',
    description: 'Webhook',
    data: { nextStepId: 'action' },
  },
  {
    id: 'action',
    type: 'action',
    icon: 'Code',
    title: 'Custom Code',
    description: 'Code',
    content: { language: 'typescript', code: 'return context;' },
  },
];

test('workflow graph comparison ignores object key ordering but detects connection changes', () => {
  const reordered = JSON.parse(JSON.stringify(baseSteps)) as WorkflowStepData[];
  reordered[0].data = { nextStepId: 'action' };
  assert.equal(workflowGraphsEqual(baseSteps, reordered), true);

  const disconnected = structuredClone(baseSteps);
  disconnected[0].data = {};
  assert.equal(workflowGraphsEqual(baseSteps, disconnected), false);
});

test('version history collapses legacy duplicate version numbers', () => {
  const versions = dedupeVersionsByNumber([
    { id: 'newest-v2', version: 2 },
    { id: 'duplicate-v2', version: 2 },
    { id: 'v1', version: 1 },
  ]);
  assert.deepEqual(versions.map((version) => version.id), ['newest-v2', 'v1']);
});

test('run series fills empty dates and separates successful and failed runs', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');
  const series = buildRunSeries([
    { startedAt: new Date('2026-06-13T01:00:00.000Z'), status: 'SUCCESS' },
    { startedAt: new Date('2026-06-15T02:00:00.000Z'), status: 'FAILED' },
    { startedAt: new Date('2026-06-15T03:00:00.000Z'), status: 'TIMED_OUT' },
  ], 3, now);

  assert.deepEqual(series, [
    { date: '2026-06-13', runs: 1, successful: 1, failed: 0, other: 0 },
    { date: '2026-06-14', runs: 0, successful: 0, failed: 0, other: 0 },
    { date: '2026-06-15', runs: 2, successful: 0, failed: 2, other: 0 },
  ]);
});
