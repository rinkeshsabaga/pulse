import assert from 'node:assert/strict';
import test from 'node:test';
import type { IconName, WorkflowStepData } from '../src/lib/types';
import { executeWorkflowGraph, validateWorkflow } from '../src/lib/workflow-graph';

const icon: IconName = 'Code';

function step(
  id: string,
  title: string,
  data: WorkflowStepData['data'] = {},
  type: WorkflowStepData['type'] = 'action'
): WorkflowStepData {
  return { id, title, type, icon, description: title, data };
}

test('executes a linear workflow in order', async () => {
  const steps = [
    step('trigger', 'Webhook', { nextStepId: 'one' }, 'trigger'),
    step('one', 'Record One', { nextStepId: 'two' }),
    step('two', 'Record Two'),
  ];
  const executed: string[] = [];

  const result = await executeWorkflowGraph({
    steps,
    executeStep: async ({ step: current }) => {
      executed.push(current.id);
      return { success: true, output: { id: current.id } };
    },
  });

  assert.equal(result.success, true);
  assert.deepEqual(executed, ['one', 'two']);
  assert.equal(result.logs.length, 2);
});

test('selects matching and default condition branches', async () => {
  const condition = step('condition', 'If/Else', {
    conditionData: {
      cases: [{
        id: 'case-one',
        name: 'matched',
        logicalOperator: 'AND',
        rules: [{ id: 'rule-one', variable: 'trigger.match', operator: 'equals', value: 'yes' }],
        nextStepId: 'matched-step',
      }],
      defaultNextStepId: 'default-step',
    },
  });
  const steps = [
    step('trigger', 'Webhook', { nextStepId: condition.id }, 'trigger'),
    condition,
    step('matched-step', 'Matched'),
    step('default-step', 'Default'),
  ];

  const run = async (outcome: string) => {
    const executed: string[] = [];
    const result = await executeWorkflowGraph({
      steps,
      executeStep: async ({ step: current }) => {
        executed.push(current.id);
        return current.id === 'condition'
          ? { success: true, outcome }
          : { success: true };
      },
    });
    return { result, executed };
  };

  const matched = await run('matched');
  assert.equal(matched.result.success, true);
  assert.deepEqual(matched.executed, ['condition', 'matched-step']);

  const fallback = await run('default');
  assert.equal(fallback.result.success, true);
  assert.deepEqual(fallback.executed, ['condition', 'default-step']);
});

test('executes parallel branches concurrently and records distinct logs', async () => {
  const steps = [
    step('trigger', 'Webhook', { nextStepId: 'parallel' }, 'trigger'),
    step('parallel', 'Parallel', {
      branches: [
        { id: 'branch-a', name: 'A', nextStepId: 'a' },
        { id: 'branch-b', name: 'B', nextStepId: 'b' },
      ],
    }),
    step('a', 'Branch A'),
    step('b', 'Branch B'),
  ];
  let active = 0;
  let maxActive = 0;

  const result = await executeWorkflowGraph({
    steps,
    executeStep: async ({ step: current }) => {
      if (current.id === 'a' || current.id === 'b') {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
      }
      return { success: true, output: current.id };
    },
  });

  assert.equal(result.success, true);
  assert.equal(maxActive, 2);
  assert.equal(result.logs.length, 3);
  assert.equal(new Set(result.logs.map((log) => log.executionId)).size, 3);
});

test('rejects missing references, unreachable steps, and cycles', () => {
  const missing = validateWorkflow([
    step('trigger', 'Webhook', { nextStepId: 'missing' }, 'trigger'),
  ]);
  assert.equal(missing.valid, false);
  assert.ok(missing.issues.some((issue) => issue.code === 'MISSING_STEP_REFERENCE'));

  const unreachable = validateWorkflow([
    step('trigger', 'Webhook', {}, 'trigger'),
    step('unused', 'Unused'),
  ]);
  assert.equal(unreachable.valid, false);
  assert.ok(unreachable.issues.some((issue) => issue.code === 'UNREACHABLE_STEP'));

  const circular = validateWorkflow([
    step('trigger', 'Webhook', { nextStepId: 'one' }, 'trigger'),
    step('one', 'One', { nextStepId: 'two' }),
    step('two', 'Two', { nextStepId: 'one' }),
  ]);
  assert.equal(circular.valid, false);
  assert.ok(circular.issues.some((issue) => issue.code === 'CIRCULAR_REFERENCE'));
});

test('stops the workflow and logs a failed step', async () => {
  const steps = [
    step('trigger', 'Webhook', { nextStepId: 'failure' }, 'trigger'),
    step('failure', 'Failure', { nextStepId: 'never' }),
    step('never', 'Never'),
  ];
  const executed: string[] = [];

  const result = await executeWorkflowGraph({
    steps,
    executeStep: async ({ step: current }) => {
      executed.push(current.id);
      return current.id === 'failure'
        ? { success: false, input: { attempted: true }, error: 'Expected failure' }
        : { success: true };
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Expected failure');
  assert.deepEqual(executed, ['failure']);
  assert.equal(result.logs[0].status, 'failed');
  assert.deepEqual(result.logs[0].input, { attempted: true });
});

test('recognizes legacy renamed app action nodes and validates their credential and parameters', () => {
  const valid = validateWorkflow([
    step('trigger', 'Webhook', { nextStepId: 'slack' }, 'trigger'),
    step('slack', 'Slack Action', {
      appAction: {
        app: 'Slack',
        action: 'send_message',
        credentialId: 'credential-one',
        params: { channel: '#general', text: 'Hello' },
      },
    }),
  ]);
  assert.equal(valid.valid, true);

  const missingCredential = validateWorkflow([
    step('trigger', 'Webhook', { nextStepId: 'slack' }, 'trigger'),
    step('slack', 'Slack Action', {
      appAction: {
        app: 'Slack',
        action: 'send_message',
        params: { channel: '#general', text: 'Hello' },
      },
    }),
  ]);
  assert.ok(missingCredential.issues.some((issue) => issue.message.includes('select a credential')));
});

test('validates app event triggers require an app, event, and credential', () => {
  const valid = validateWorkflow([
    step('trigger', 'App Event', {
      appTrigger: {
        app: 'WooCommerce',
        event: 'order_created',
        credentialId: 'credential-one',
      },
    }, 'trigger'),
  ]);
  assert.equal(valid.valid, true);

  const missingCredential = validateWorkflow([
    step('trigger', 'App Event', {
      appTrigger: {
        app: 'WooCommerce',
        event: 'order_created',
      },
    }, 'trigger'),
  ]);
  assert.equal(missingCredential.valid, false);
  assert.ok(missingCredential.issues.some((issue) => issue.message.includes('select a credential')));
});
