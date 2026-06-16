import assert from 'node:assert/strict';
import test from 'node:test';
import { executeCustomCode } from '../src/lib/custom-code-executor';

test('executes custom code with cloned workflow context', async () => {
  const result = await executeCustomCode({
    code: 'return { customer: context.trigger.customer, runId: context._meta.runId };',
    context: {
      trigger: { customer: 'Ada' },
      _meta: { runId: 'run-one' },
    },
  });

  assert.deepEqual(result, { customer: 'Ada', runId: 'run-one' });
});

test('does not expose Node globals to custom code', async () => {
  await assert.rejects(
    () => executeCustomCode({
      code: 'return require("node:fs").readdirSync(".");',
      context: {},
    }),
    /require is not defined/
  );

  await assert.rejects(
    () => executeCustomCode({
      code: 'return process.env;',
      context: {},
    }),
    /process is not defined/
  );
});

test('custom code execution is disabled in production unless explicitly enabled', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.ENABLE_CUSTOM_CODE_EXECUTION;
  setProcessEnv('NODE_ENV', 'production');
  setProcessEnv('ENABLE_CUSTOM_CODE_EXECUTION', undefined);

  try {
    await assert.rejects(
      () => executeCustomCode({ code: 'return 1;', context: {} }),
      /disabled in production/
    );
  } finally {
    setProcessEnv('NODE_ENV', originalNodeEnv);
    setProcessEnv('ENABLE_CUSTOM_CODE_EXECUTION', originalFlag);
  }
});

function setProcessEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
    return;
  }

  Object.defineProperty(process.env, name, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}
