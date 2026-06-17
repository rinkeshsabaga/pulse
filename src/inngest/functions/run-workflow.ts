import { inngest } from '@/inngest/client';
import { db } from '@/lib/db';
import { createRun, updateRun } from '@/services/runs';
import { checkWorkflowRunEntitlement, recordRunUsage } from '@/services/usage';
import { isAppActionStep, isAppTriggerStep, type WorkflowStepData, type Case, type Rule } from '@/lib/types';
import type { StepLog } from '@/services/runs';
import { resolveVariables } from '@/lib/variable-resolver';
import { getCredentialSecrets } from '@/services/credentials';
import { executeWorkflowGraph, type StepExecutionResult } from '@/lib/workflow-graph';
import { executeIntegrationAction, assertAllowedHost } from '@/lib/integration-executor';
import { executeCustomCode } from '@/lib/custom-code-executor';
import { getFeatureEnv } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Inngest Workflow Runner Function
// Handles durable, reliable execution of all workflow step types.
// ─────────────────────────────────────────────────────────────────────────────

export const runWorkflowFunction = inngest.createFunction(
  {
    id: 'run-workflow',
    name: 'Run Workflow',
    retries: 3,
    concurrency: {
      limit: 5,
      key: 'event.data.organizationId', // Max 5 concurrent runs per org
    },
    triggers: [{ event: 'workflow/run' }],
    onFailure: async ({ event, error }) => {
      const failedEvent = event.data.event as { id?: string };
      if (failedEvent.id) {
        const run = await db.workflowRun.findFirst({
          where: { inngestRunId: failedEvent.id },
          select: { id: true },
        });
        if (run) await updateRun(run.id, {
          status: 'FAILED',
          error: error.message,
        });
      }
    },
  },
  async ({ event, step }) => {
    const { workflowId, organizationId, trigger, triggerData } = event.data;

    // ── 1. Load workflow from DB ─────────────────────────────────────────────
    const workflow = await step.run('load-workflow', async () => {
      const wf = await db.workflow.findFirst({
        where: { id: workflowId, organizationId, status: 'PUBLISHED' },
      });
      if (!wf) throw new Error(`Workflow ${workflowId} not found or not published.`);
      return wf;
    });

    const steps = workflow.steps as WorkflowStepData[];

    // ── 2. Enforce quota and current plan limits ─────────────────────────────
    await step.run('check-entitlement', async () => {
      await checkWorkflowRunEntitlement(organizationId, steps);
    });

    // ── 3. Create run record ─────────────────────────────────────────────────
    const run = await step.run('create-run', async () => {
      return createRun({
        workflowId,
        organizationId,
        trigger,
        triggerData: triggerData ?? {},
        inngestRunId: event.id,
      });
    });

    const runStartedAt = new Date(run.startedAt);
    const initialContext: Record<string, unknown> = {
      trigger: triggerData ?? {},
      _meta: {
        workflowId,
        runId: run.id,
        orgId: organizationId,
        startedAt: runStartedAt.toISOString(),
      },
    };

    const execution = await executeWorkflowGraph({
      steps,
      initialContext,
      executeStep: async ({ step: stepDef, context, executionId }) => {
        const stepResult = await step.run(
          inngestStepId('execute', executionId),
          () => executeStepDefinition(stepDef, context, organizationId)
        );

        if (stepResult.success && stepDef.title === 'Wait') {
          const waitedMilliseconds = await handleWaitStep(stepDef, context, step, executionId);
          return {
            ...stepResult,
            output: { waitedMilliseconds },
          };
        }

        return stepResult;
      },
    });

    const stepLogs = execution.logs as StepLog[];
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - runStartedAt.getTime();

    if (!execution.success) {
      await step.run('fail-run', () => updateRun(run.id, {
        status: 'FAILED',
        error: execution.error ?? 'Workflow execution failed.',
        stepLogs,
        finishedAt,
        durationMs,
      }));
      return { success: false, runId: run.id, error: execution.error };
    }

    await step.run('complete-run', async () => {
      await updateRun(run.id, {
        status: 'SUCCESS',
        stepLogs,
        finishedAt,
        durationMs,
      });
      await recordRunUsage({ orgId: organizationId, runId: run.id });
    });

    return { success: true, runId: run.id, context: execution.context };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Step Executor — routes to the right executor based on step type
// ─────────────────────────────────────────────────────────────────────────────

async function executeStepDefinition(
  stepDef: WorkflowStepData,
  context: Record<string, unknown>,
  organizationId: string
): Promise<StepExecutionResult> {
  const data = stepDef.data ?? {};

  try {
    if (isAppActionStep(stepDef)) {
      return executeAppActionStep(stepDef, context, organizationId);
    }
    if (isAppTriggerStep(stepDef)) {
      return { success: true, output: context.trigger };
    }

    switch (stepDef.title) {
      case 'API Request': {
        const resolvedUrl = resolveVariables(data.apiUrl ?? '', context);
        const url = new URL(resolvedUrl);
        assertAllowedHost(url);
        const headers: Record<string, string> = {};

        // Build auth headers
        if (data.auth?.type === 'bearer') {
          headers['Authorization'] = `Bearer ${resolveVariables(data.auth.token ?? '', context)}`;
        } else if (data.auth?.type === 'apiKey' && data.auth.apiKeyLocation === 'header') {
          headers[data.auth.apiKeyHeaderName ?? 'X-API-Key'] = resolveVariables(data.auth.apiKey ?? '', context);
        } else if (data.auth?.type === 'apiKey' && data.auth.apiKeyLocation === 'query') {
          url.searchParams.set(
            data.auth.apiKeyHeaderName ?? 'api_key',
            resolveVariables(data.auth.apiKey ?? '', context)
          );
        } else if (data.auth?.type === 'basic') {
          const creds = Buffer.from(`${data.auth.username}:${data.auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${creds}`;
        }

        // Add custom headers
        (data.headers ?? []).forEach((h: { key: string; value: string }) => {
          if (h.key) headers[h.key] = resolveVariables(h.value ?? '', context);
        });

        let body: string | undefined;
        if (data.body?.type === 'json') {
          headers['Content-Type'] = 'application/json';
          body = resolveVariables(data.body.content, context);
        } else if (data.body?.type === 'form-urlencoded') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          body = (data.body.content ?? [])
            .map((p: { key: string; value: string }) => `${encodeURIComponent(p.key)}=${encodeURIComponent(resolveVariables(p.value, context))}`)
            .join('&');
        }

        const response = await fetch(url, {
          method: data.method ?? 'GET',
          headers,
          ...(body ? { body } : {}),
        });

        const responseText = await response.text();
        let responseBody: unknown = responseText;
        try {
          responseBody = responseText ? JSON.parse(responseText) : null;
        } catch {
          // Keep non-JSON responses as text.
        }
        const output = { status: response.status, ok: response.ok, body: responseBody };
        const input = { url: url.toString(), method: data.method ?? 'GET' };

        if (!response.ok) {
          return { success: false, input, output, error: `HTTP ${response.status}` };
        }
        return { success: true, input, output };
      }

      case 'Send Email': {
        const { Resend } = await import('resend');
        const resend = new Resend(getFeatureEnv('RESEND_API_KEY', 'Resend email'));

        const emailData = data.emailData;
        const to = resolveVariables(emailData?.to ?? '', context);
        const from = resolveVariables(
          emailData?.from ?? process.env.RESEND_FROM_EMAIL ?? 'noreply@sabagapulse.com',
          context
        );
        const subject = resolveVariables(emailData?.subject ?? '', context);
        const htmlBody = resolveVariables(emailData?.body ?? '', context);

        const { data: sentEmail, error } = await resend.emails.send({
          from,
          to,
          subject,
          html: htmlBody,
        });

        const input = { from, to, subject };
        if (error) return { success: false, input, error: error.message };
        return { success: true, input, output: { id: sentEmail?.id } };
      }

      case 'Database Query': {
        const databaseData = data.databaseQueryData;
        const credentialId = databaseData?.credentialId ?? '';
        const query = resolveVariables(databaseData?.query ?? '', context);

        // Block destructive SQL statements
        const normalizedQuery = query.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim();
        const destructivePattern = /^\s*(DROP|ALTER|DELETE|INSERT|UPDATE|TRUNCATE|CREATE|GRANT|REVOKE|EXEC)\b/i;
        if (destructivePattern.test(normalizedQuery)) {
          return {
            success: false,
            input: { credentialId, query },
            error: 'Only SELECT queries are allowed. Destructive statements (DROP, ALTER, DELETE, INSERT, UPDATE, etc.) are blocked.',
          };
        }

        const credential = await db.credential.findFirst({
          where: { id: credentialId, organizationId, type: 'DATABASE_URL' },
          select: { id: true },
        });

        if (!credential) {
          return {
            success: false,
            input: { credentialId, query },
            error: 'Database credential not found.',
          };
        }

        const secrets = await getCredentialSecrets(credential.id, organizationId);
        const connectionString = typeof secrets.connectionString === 'string'
          ? secrets.connectionString
          : '';
        if (!connectionString) {
          return {
            success: false,
            input: { credentialId, query },
            error: 'Database credential has no connection string.',
          };
        }

        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString });
        try {
          // Enforce read-only at the database level as a defense-in-depth measure
          await pool.query('BEGIN TRANSACTION READ ONLY');
          const queryResult = await pool.query(query);
          await pool.query('COMMIT');
          return {
            success: true,
            input: { credentialId, query },
            output: { rows: queryResult.rows, rowCount: queryResult.rowCount },
          };
        } catch (dbError) {
          // Roll back the read-only transaction on any error
          try { await pool.query('ROLLBACK'); } catch { /* ignore rollback errors */ }
          throw dbError;
        } finally {
          await pool.end();
        }
      }

      case 'If/Else':
      case 'Switch': {
        // Evaluate cases against context
        const cases = data.conditionData?.cases ?? [];
        for (const c of cases) {
          const matches = evaluateCase(c, context);
          if (matches) {
            return {
              success: true,
              input: { cases: cases.length },
              outcome: c.name,
              output: { matched: c.name },
            };
          }
        }
        return {
          success: true,
          input: { cases: cases.length },
          outcome: 'default',
          output: { matched: 'default' },
        };
      }

      case 'Custom Code':
      case 'Custom AI Function': {
        const output = await executeCustomCode({
          code: stepDef.content?.code ?? '',
          context,
        });
        return {
          success: true,
          input: { language: stepDef.content?.language ?? 'typescript' },
          output: output ?? null,
        };
      }

      case 'Wait':
        return {
          success: true,
          input: {
            mode: data.waitMode,
            value: data.waitDurationValue,
            unit: data.waitDurationUnit,
            dateTime: data.waitDateTime,
          },
          output: {},
        };

      case 'Parallel':
        return {
          success: true,
          input: { branches: (data.branches ?? []).map((branch) => branch.name) },
          output: { branchesStarted: data.branches?.length ?? 0 },
        };

      case 'End Automation':
        return { success: true, output: { ended: true } };

      case 'Filter': {
        return {
          success: true,
          output: { note: 'Filter execution is not configured yet.' },
        };
      }

      // Trigger steps don't execute — they start the chain
      case 'Webhook':
      case 'Cron Job':
      case 'Shopify':
        return { success: true, output: context.trigger };

      default:
        return { success: true, output: { note: `Step type "${stepDef.title}" executed (no-op)` } };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

async function executeAppActionStep(
  stepDef: WorkflowStepData,
  context: Record<string, unknown>,
  organizationId: string
): Promise<StepExecutionResult> {
  const appAction = stepDef.data?.appAction;
  const appName = appAction?.app;
  const action = appAction?.action;
  const credentialId = appAction?.credentialId;

  if (!appName || !action || !credentialId) {
    return { success: false, error: 'App Action requires an app, action, and credential.' };
  }

  const credential = await db.credential.findFirst({
    where: {
      id: credentialId,
      organizationId,
      appName,
      type: { in: ['OAUTH', 'API_KEY', 'BASIC_AUTH'] },
    },
  });
  if (!credential) {
    return { success: false, error: `The selected ${appName} credential was not found or is no longer usable.` };
  }

  const resolvedParams = resolveIntegrationValue(appAction.params ?? {}, context) as Record<string, unknown>;
  const secrets = credential.type === 'OAUTH'
    ? {}
    : await getCredentialSecrets(credential.id, organizationId);
  const output = await executeIntegrationAction({
    appName,
    action,
    params: resolvedParams,
    credential: {
      type: credential.type,
      nangoConnectionId: credential.nangoConnectionId,
      secrets,
    },
  });

  return {
    success: true,
    input: { appName, action, params: resolvedParams, credentialId: credential.id },
    output,
  };
}

function resolveIntegrationValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === 'string') return resolveVariables(value, context);
  if (Array.isArray(value)) return value.map((item) => resolveIntegrationValue(item, context));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveIntegrationValue(item, context)])
    );
  }
  return value;
}

// ─── Wait Step Handler ────────────────────────────────────────────────────────

async function handleWaitStep(
  stepDef: WorkflowStepData,
  context: Record<string, unknown>,
  step: any,
  executionId: string
): Promise<number> {
  const data = stepDef.data ?? {};
  const operationId = inngestStepId('wait', executionId);

  switch (data.waitMode) {
    case 'duration': {
      const unit = data.waitDurationUnit ?? 'minutes';
      const value = data.waitDurationValue ?? 1;
      const multiplier = { seconds: 1_000, minutes: 60_000, hours: 3_600_000, days: 86_400_000 }[unit] ?? 60_000;
      const ms = value * multiplier;
      await step.sleep(operationId, ms);
      return ms;
    }
    case 'datetime': {
      if (data.waitDateTime) {
        const target = new Date(data.waitDateTime);
        const ms = Math.max(0, target.getTime() - Date.now());
        if (ms > 0) await step.sleepUntil(operationId, target);
        return ms;
      }
      return 0;
    }
    case 'timestamp': {
      const timestamp = resolveVariables(data.waitTimestamp ?? '', context);
      const target = new Date(timestamp);
      const ms = Number.isNaN(target.getTime()) ? 0 : Math.max(0, target.getTime() - Date.now());
      if (ms > 0) await step.sleepUntil(operationId, target);
      return ms;
    }
    case 'specific_day': {
      const target = nextScheduledDay(
        data.waitSpecificDays ?? [],
        data.waitSpecificTime ?? '',
        new Date()
      );
      if (!target) return 0;
      const ms = Math.max(0, target.getTime() - Date.now());
      if (ms > 0) await step.sleepUntil(operationId, target);
      return ms;
    }
    case 'office_hours': {
      if (data.waitOfficeHoursAction === 'proceed') return 0;
      const target = nextOfficeHoursStart(
        data.waitOfficeHoursDays ?? [],
        data.waitOfficeHoursStartTime ?? '',
        data.waitOfficeHoursEndTime ?? '',
        new Date()
      );
      if (!target) return 0;
      const ms = Math.max(0, target.getTime() - Date.now());
      if (ms > 0) await step.sleepUntil(operationId, target);
      return ms;
    }
    default:
      return 0;
  }
}

function nextScheduledDay(days: string[], time: string, now: Date): Date | null {
  const [hours, minutes] = parseTime(time);
  if (hours === null || minutes === null || days.length === 0) return null;

  const dayIndexes = days.map(dayToIndex).filter((day): day is number => day !== null);
  const candidates = dayIndexes.map((dayIndex) => {
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);
    let daysAhead = (dayIndex - now.getDay() + 7) % 7;
    if (daysAhead === 0 && candidate <= now) daysAhead = 7;
    candidate.setDate(candidate.getDate() + daysAhead);
    return candidate;
  });

  return candidates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

function nextOfficeHoursStart(
  days: string[],
  startTime: string,
  endTime: string,
  now: Date
): Date | null {
  const [startHours, startMinutes] = parseTime(startTime);
  const [endHours, endMinutes] = parseTime(endTime);
  if (
    startHours === null || startMinutes === null ||
    endHours === null || endMinutes === null ||
    days.length === 0
  ) {
    return null;
  }

  const today = dayName(now.getDay());
  const todayStart = new Date(now);
  todayStart.setHours(startHours, startMinutes, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(endHours, endMinutes, 0, 0);

  if (days.includes(today) && now >= todayStart && now <= todayEnd) return null;
  if (days.includes(today) && now < todayStart) return todayStart;
  return nextScheduledDay(days, startTime, now);
}

function parseTime(time: string): [number | null, number | null] {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return [null, null];
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return [null, null];
  return [hours, minutes];
}

function dayToIndex(day: string): number | null {
  const index = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day);
  return index === -1 ? null : index;
}

function dayName(index: number): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][index];
}

function inngestStepId(prefix: string, executionId: string): string {
  return `${prefix}-${executionId}`.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 200);
}

// ─── Condition Evaluator ──────────────────────────────────────────────────────

function evaluateCase(caseItem: Case, context: Record<string, unknown>): boolean {
  const results = (caseItem.rules ?? []).map((rule: Rule) => evaluateRule(rule, context));
  return caseItem.logicalOperator === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

function evaluateRule(rule: Rule, context: Record<string, unknown>): boolean {
  const value = getNestedValue(context, rule.variable);
  const str = String(value ?? '');

  switch (rule.operator) {
    case 'equals': return str === rule.value;
    case 'not_equals': return str !== rule.value;
    case 'contains': return str.includes(rule.value);
    case 'not_contains': return !str.includes(rule.value);
    case 'starts_with': return str.startsWith(rule.value);
    case 'ends_with': return str.endsWith(rule.value);
    case 'is_empty': return str === '' || value === null || value === undefined;
    case 'is_not_empty': return str !== '' && value !== null && value !== undefined;
    case 'greater_than': return Number(value) > Number(rule.value);
    case 'less_than': return Number(value) < Number(rule.value);
    default: return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}
