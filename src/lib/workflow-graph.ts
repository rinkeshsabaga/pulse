import { isAppActionStep, isAppTriggerStep, type WorkflowStepData } from './types';
import { validateIntegrationActionParams } from './integration-actions';

export type WorkflowValidationIssue = {
  code:
    | 'EMPTY_WORKFLOW'
    | 'DUPLICATE_STEP_ID'
    | 'INVALID_TRIGGER_COUNT'
    | 'MISSING_STEP_REFERENCE'
    | 'UNREACHABLE_STEP'
    | 'CIRCULAR_REFERENCE'
    | 'INVALID_STEP_CONFIGURATION';
  message: string;
  stepId?: string;
};

export type WorkflowValidationResult = {
  valid: boolean;
  issues: WorkflowValidationIssue[];
};

export type StepExecutionResult = {
  success: boolean;
  input?: unknown;
  output?: unknown;
  error?: string;
  outcome?: string;
};

export type WorkflowExecutionLog = {
  executionId: string;
  stepId: string;
  stepTitle: string;
  status: 'success' | 'failed';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  input?: unknown;
  output?: unknown;
  error?: string;
};

export type WorkflowGraphExecutionResult = {
  success: boolean;
  context: Record<string, unknown>;
  logs: WorkflowExecutionLog[];
  error?: string;
};

type ExecuteWorkflowGraphOptions = {
  steps: WorkflowStepData[];
  initialContext?: Record<string, unknown>;
  executeStep: (args: {
    step: WorkflowStepData;
    context: Record<string, unknown>;
    executionId: string;
  }) => Promise<StepExecutionResult>;
  now?: () => Date;
  maxStepExecutions?: number;
};

type PathResult = {
  success: boolean;
  context: Record<string, unknown>;
  error?: string;
};

export function getStepTargets(step: WorkflowStepData): string[] {
  if (isConditionStep(step)) {
    const conditionData = step.data?.conditionData;
    return [
      ...(conditionData?.cases.map((caseItem) => caseItem.nextStepId) ?? []),
      conditionData?.defaultNextStepId,
    ].filter((target): target is string => Boolean(target));
  }

  if (step.title === 'Parallel') {
    return (step.data?.branches ?? [])
      .map((branch) => branch.nextStepId)
      .filter((target): target is string => Boolean(target));
  }

  return step.data?.nextStepId ? [step.data.nextStepId] : [];
}

export function validateWorkflow(steps: WorkflowStepData[]): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = [];

  if (steps.length === 0) {
    return {
      valid: false,
      issues: [{ code: 'EMPTY_WORKFLOW', message: 'Add at least one trigger before publishing.' }],
    };
  }

  const stepIds = new Set<string>();
  for (const step of steps) {
    if (stepIds.has(step.id)) {
      issues.push({
        code: 'DUPLICATE_STEP_ID',
        message: `Step ID "${step.id}" is used more than once.`,
        stepId: step.id,
      });
    }
    stepIds.add(step.id);
  }

  const triggers = steps.filter((step) => step.type === 'trigger');
  if (triggers.length !== 1) {
    issues.push({
      code: 'INVALID_TRIGGER_COUNT',
      message: `A workflow must contain exactly one trigger; found ${triggers.length}.`,
    });
  }

  const stepMap = new Map(steps.map((step) => [step.id, step]));
  for (const step of steps) {
    validateStepConfiguration(step, issues);
    for (const targetId of getStepTargets(step)) {
      if (!stepMap.has(targetId)) {
        issues.push({
          code: 'MISSING_STEP_REFERENCE',
          message: `"${step.title}" points to a step that no longer exists.`,
          stepId: step.id,
        });
      }
    }
  }

  detectCycles(steps, stepMap, issues);

  if (triggers.length === 1) {
    const reachable = collectReachableSteps(triggers[0].id, stepMap);
    for (const step of steps) {
      if (!reachable.has(step.id)) {
        issues.push({
          code: 'UNREACHABLE_STEP',
          message: `"${step.title}" is not connected to the workflow trigger.`,
          stepId: step.id,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export async function executeWorkflowGraph({
  steps,
  initialContext = {},
  executeStep,
  now = () => new Date(),
  maxStepExecutions = Math.max(100, steps.length * 4),
}: ExecuteWorkflowGraphOptions): Promise<WorkflowGraphExecutionResult> {
  const validation = validateWorkflow(steps);
  const context = cloneContext(initialContext);
  const logs: WorkflowExecutionLog[] = [];

  if (!validation.valid) {
    return {
      success: false,
      context,
      logs,
      error: validation.issues.map((issue) => issue.message).join(' '),
    };
  }

  const trigger = steps.find((step) => step.type === 'trigger');
  if (!trigger) {
    return { success: false, context, logs, error: 'Workflow trigger was not found.' };
  }

  const stepMap = new Map(steps.map((step) => [step.id, step]));
  let executionCount = 0;

  const executePath = async (
    startStepId: string | undefined,
    pathContext: Record<string, unknown>,
    path: string[],
    ancestors: Set<string>
  ): Promise<PathResult> => {
    let currentStepId = startStepId;
    const activeAncestors = new Set(ancestors);

    while (currentStepId) {
      executionCount += 1;
      if (executionCount > maxStepExecutions) {
        return {
          success: false,
          context: pathContext,
          error: `Workflow exceeded the ${maxStepExecutions}-step execution limit.`,
        };
      }

      if (activeAncestors.has(currentStepId)) {
        return {
          success: false,
          context: pathContext,
          error: `Circular reference detected at step "${currentStepId}".`,
        };
      }
      activeAncestors.add(currentStepId);

      const step = stepMap.get(currentStepId);
      if (!step) {
        return {
          success: false,
          context: pathContext,
          error: `Referenced step "${currentStepId}" does not exist.`,
        };
      }

      const executionId = [...path, step.id].join(':');
      const startedAt = now();
      let result: StepExecutionResult;

      try {
        result = await executeStep({ step, context: pathContext, executionId });
      } catch (error) {
        result = {
          success: false,
          error: error instanceof Error ? error.message : 'Step execution failed.',
        };
      }

      const finishedAt = now();
      logs.push({
        executionId,
        stepId: step.id,
        stepTitle: step.title,
        status: result.success ? 'success' : 'failed',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
        input: result.input,
        output: result.output,
        error: result.error,
      });

      if (!result.success) {
        return {
          success: false,
          context: pathContext,
          error: result.error ?? `Step "${step.title}" failed.`,
        };
      }

      pathContext[step.id] = {
        status: 'success',
        output: result.output,
      };

      if (step.title === 'End Automation') {
        return { success: true, context: pathContext };
      }

      if (isConditionStep(step)) {
        const conditionData = step.data?.conditionData;
        const matchedCase = conditionData?.cases.find((caseItem) => caseItem.name === result.outcome);
        currentStepId = matchedCase?.nextStepId ?? conditionData?.defaultNextStepId;
        continue;
      }

      if (step.title === 'Parallel') {
        const branchResults = await Promise.all(
          (step.data?.branches ?? []).map(async (branch) => {
            const branchContext = cloneContext(pathContext);
            const result = await executePath(
              branch.nextStepId,
              branchContext,
              [...path, step.id, branch.id],
              new Set(activeAncestors)
            );
            return { branch, result };
          })
        );

        const failedBranch = branchResults.find(({ result }) => !result.success);
        if (failedBranch) {
          return {
            success: false,
            context: pathContext,
            error: `Parallel branch "${failedBranch.branch.name}" failed: ${failedBranch.result.error}`,
          };
        }

        const branchOutputs: Record<string, unknown> = {};
        for (const { branch, result: branchResult } of branchResults) {
          branchOutputs[branch.id] = branchResult.context;
          Object.assign(pathContext, branchResult.context);
        }
        pathContext[step.id] = {
          status: 'success',
          output: { branches: branchOutputs },
        };

        currentStepId = step.data?.nextStepId;
        continue;
      }

      currentStepId = step.data?.nextStepId;
    }

    return { success: true, context: pathContext };
  };

  const result = await executePath(trigger.data?.nextStepId, context, ['root'], new Set([trigger.id]));
  return {
    success: result.success,
    context: result.context,
    logs,
    error: result.error,
  };
}

function isConditionStep(step: WorkflowStepData): boolean {
  return step.title === 'If/Else' || step.title === 'Switch';
}

function addConfigurationIssue(
  issues: WorkflowValidationIssue[],
  step: WorkflowStepData,
  message: string
) {
  issues.push({
    code: 'INVALID_STEP_CONFIGURATION',
    message: `"${step.title}": ${message}`,
    stepId: step.id,
  });
}

function validateStepConfiguration(
  step: WorkflowStepData,
  issues: WorkflowValidationIssue[]
) {
  const data = step.data;

  if (isAppTriggerStep(step)) {
    if (!data?.appTrigger?.app || !data.appTrigger.event) {
      addConfigurationIssue(issues, step, 'select an app and event.');
      return;
    }
    if (!data.appTrigger.credentialId) {
      addConfigurationIssue(issues, step, 'select a credential.');
    }
    return;
  }

  if (isAppActionStep(step)) {
    const appAction = data?.appAction;
    if (!appAction?.app || !appAction.action) {
      addConfigurationIssue(issues, step, 'select an app and action.');
      return;
    }
    if (!appAction.credentialId) {
      addConfigurationIssue(issues, step, 'select a credential.');
    }
    for (const message of validateIntegrationActionParams(appAction.app, appAction.action, appAction.params ?? {})) {
      addConfigurationIssue(issues, step, message);
    }
    return;
  }

  switch (step.title) {
    case 'Cron Job':
      if (!data?.cronString?.trim()) addConfigurationIssue(issues, step, 'enter a cron schedule.');
      break;
    case 'Shopify':
      if (!data?.shopifyEvent) addConfigurationIssue(issues, step, 'select an event.');
      break;
    case 'API Request':
      if (!data?.apiUrl?.trim()) addConfigurationIssue(issues, step, 'enter a request URL.');
      break;
    case 'Send Email':
      if (!data?.emailData?.to?.trim()) addConfigurationIssue(issues, step, 'enter a recipient.');
      if (!data?.emailData?.subject?.trim()) addConfigurationIssue(issues, step, 'enter a subject.');
      break;
    case 'Database Query':
      if (!data?.databaseQueryData?.credentialId) {
        addConfigurationIssue(issues, step, 'select a database credential.');
      }
      if (!data?.databaseQueryData?.query?.trim()) {
        addConfigurationIssue(issues, step, 'enter a query.');
      }
      break;
    case 'Custom Code':
    case 'Custom AI Function':
      if (!step.content?.code?.trim()) addConfigurationIssue(issues, step, 'enter code to execute.');
      break;
    case 'Wait':
      if (!data?.waitMode) addConfigurationIssue(issues, step, 'select a wait mode.');
      if (data?.waitMode === 'duration' && (!data.waitDurationValue || data.waitDurationValue <= 0)) {
        addConfigurationIssue(issues, step, 'enter a duration greater than zero.');
      }
      if (data?.waitMode === 'datetime' && !data.waitDateTime) {
        addConfigurationIssue(issues, step, 'select a date and time.');
      }
      if (data?.waitMode === 'timestamp' && !data.waitTimestamp?.trim()) {
        addConfigurationIssue(issues, step, 'enter a timestamp.');
      }
      if (
        data?.waitMode === 'specific_day' &&
        (!(data.waitSpecificDays?.length) || !data.waitSpecificTime)
      ) {
        addConfigurationIssue(issues, step, 'select at least one day and a time.');
      }
      if (
        data?.waitMode === 'office_hours' &&
        (!(data.waitOfficeHoursDays?.length) ||
          !data.waitOfficeHoursStartTime ||
          !data.waitOfficeHoursEndTime ||
          !data.waitOfficeHoursAction)
      ) {
        addConfigurationIssue(issues, step, 'configure office days, hours, and behavior.');
      }
      break;
    case 'If/Else':
    case 'Switch': {
      const cases = data?.conditionData?.cases ?? [];
      if (cases.length === 0) addConfigurationIssue(issues, step, 'add at least one case.');
      for (const caseItem of cases) {
        if (!caseItem.name.trim()) addConfigurationIssue(issues, step, 'name every case.');
        if (caseItem.rules.length === 0) addConfigurationIssue(issues, step, `add a rule to ${caseItem.name}.`);
        for (const rule of caseItem.rules) {
          if (!rule.variable.trim()) addConfigurationIssue(issues, step, `select a variable for ${caseItem.name}.`);
        }
      }
      break;
    }
    case 'Parallel': {
      const branches = data?.branches ?? [];
      if (branches.length < 2) addConfigurationIssue(issues, step, 'add at least two branches.');
      for (const branch of branches) {
        if (!branch.name.trim()) addConfigurationIssue(issues, step, 'name every branch.');
      }
      break;
    }
    case 'Filter':
      addConfigurationIssue(issues, step, 'this step is not executable yet.');
      break;
  }
}

function collectReachableSteps(
  startStepId: string,
  stepMap: Map<string, WorkflowStepData>
): Set<string> {
  const reachable = new Set<string>();
  const pending = [startStepId];

  while (pending.length > 0) {
    const stepId = pending.pop()!;
    if (reachable.has(stepId)) continue;
    reachable.add(stepId);

    const step = stepMap.get(stepId);
    if (!step) continue;
    for (const targetId of getStepTargets(step)) pending.push(targetId);
  }

  return reachable;
}

function detectCycles(
  steps: WorkflowStepData[],
  stepMap: Map<string, WorkflowStepData>,
  issues: WorkflowValidationIssue[]
) {
  const state = new Map<string, 'visiting' | 'visited'>();
  const reported = new Set<string>();

  const visit = (stepId: string) => {
    if (state.get(stepId) === 'visited') return;
    if (state.get(stepId) === 'visiting') {
      if (!reported.has(stepId)) {
        const step = stepMap.get(stepId);
        issues.push({
          code: 'CIRCULAR_REFERENCE',
          message: `A circular connection includes "${step?.title ?? stepId}".`,
          stepId,
        });
        reported.add(stepId);
      }
      return;
    }

    state.set(stepId, 'visiting');
    const step = stepMap.get(stepId);
    if (step) {
      for (const targetId of getStepTargets(step)) {
        if (stepMap.has(targetId)) visit(targetId);
      }
    }
    state.set(stepId, 'visited');
  };

  for (const step of steps) visit(step.id);
}

function cloneContext(context: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(context);
}
