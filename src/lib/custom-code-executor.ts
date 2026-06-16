import type { Context } from 'node:vm';

const DEFAULT_TIMEOUT_MS = 1_000;
const MAX_CODE_LENGTH = 20_000;

export async function executeCustomCode(args: {
  code: string;
  context: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<unknown> {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CUSTOM_CODE_EXECUTION !== 'true') {
    throw new Error(
      'Custom Code execution is disabled in production. Enable it only after configuring an isolated execution runtime.'
    );
  }

  const code = args.code.trim();
  if (!code) return null;
  if (code.length > MAX_CODE_LENGTH) {
    throw new Error(`Custom Code exceeds the ${MAX_CODE_LENGTH}-character limit.`);
  }

  const { Script, createContext } = await import('node:vm');
  const sandbox = createContext({
    __pulseContext: cloneJson(args.context, {}),
    __pulseResult: undefined as Promise<unknown> | unknown,
  }, {
    codeGeneration: { strings: false, wasm: false },
  }) as Context & { __pulseResult: Promise<unknown> | unknown };

  const script = new Script(`
    "use strict";
    __pulseResult = (async () => {
      const context = __pulseContext;
      ${code}
    })();
  `);

  script.runInContext(sandbox, {
    timeout: args.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    displayErrors: true,
  });

  const result = await Promise.race([
    sandbox.__pulseResult,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Custom Code timed out.')), args.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    }),
  ]);
  return cloneJson(result, null);
}

function cloneJson(value: unknown, fallback: unknown): unknown {
  const serialized = JSON.stringify(value ?? fallback);
  if (serialized === undefined) return fallback;
  return JSON.parse(serialized);
}
