

import type { ReactElement, ElementType } from 'react';
import type { Node, Edge } from 'reactflow';
import { z } from 'zod';

export type IconName =
  | 'Webhook'
  | 'Mail'
  | 'FlaskConical'
  | 'Database'
  | 'ArrowRightLeft'
  | 'GitBranch'
  | 'Clock'
  | 'ShoppingCart'
  | 'StopCircle'
  | 'Code'
  | 'AppWindow'
  | 'GitCommit'
  | 'Split'
  | 'Filter';

export type WaitMode = 'duration' | 'datetime' | 'office_hours' | 'timestamp' | 'specific_day';
export type OfficeHoursDay = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export const OfficeHoursDaySchema = z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
export const WaitModeSchema = z.enum(['duration', 'datetime', 'office_hours', 'timestamp', 'specific_day']);

export const WaitInputSchema = z.object({
  waitMode: WaitModeSchema.default('duration'),
  waitDurationValue: z.number().optional(),
  waitDurationUnit: z.enum(['minutes', 'hours', 'days']).optional(),
  waitDateTime: z.string().datetime({ message: "Invalid datetime string" }).optional(),
  waitOfficeHoursDays: z.array(OfficeHoursDaySchema).optional(),
  waitOfficeHoursStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format, expected HH:mm" }).optional(),
  waitOfficeHoursEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format, expected HH:mm" }).optional(),
  waitOfficeHoursAction: z.enum(['wait', 'proceed']).optional(),
  waitTimestamp: z.string().optional(),
  waitSpecificDays: z.array(OfficeHoursDaySchema).optional(),
  waitSpecificTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format, expected HH:mm" }).optional(),
});
export type WaitInput = z.infer<typeof WaitInputSchema>;

export const WaitOutputSchema = z.object({
  waitedMilliseconds: z.number(),
});
export type WaitOutput = z.infer<typeof WaitOutputSchema>;

export type WaitData = {
    waitMode?: WaitMode;
    waitDurationValue?: number;
    waitDurationUnit?: 'minutes' | 'hours' | 'days';
    waitDateTime?: string; // ISO string
    waitOfficeHoursDays?: OfficeHoursDay[];
    waitOfficeHoursStartTime?: string; // "HH:mm"
    waitOfficeHoursEndTime?: string; // "HH:mm"
    waitOfficeHoursAction?: 'wait' | 'proceed';
    waitTimestamp?: string;
    waitSpecificDays?: OfficeHoursDay[];
    waitSpecificTime?: string; // "HH:mm"
};

export type ShopifyEvent = 'abandoned_checkout' | 'order_placed' | 'order_fulfilled' | 'order_cancelled' | 'refund_initiated' | 'order_shipment' | 'order_updated';
export type ShopifySubEvent = 'shipment_in_transit' | 'shipment_out_for_delivery' | 'shipment_delivered' | 'update_tags_added' | 'update_tags_removed' | 'update_line_items_changed';

export type ShopifyTriggerData = {
    shopifyEvent?: ShopifyEvent;
    shopifySubEvent?: ShopifySubEvent;
};

export type WebhookEvent = {
  id: string;
  receivedAt: string;
  method: string;
  headers: Record<string, string>;
  body: any;
};

export type ApiKeyAuth = {
  type: 'apiKey';
  apiKey?: string;
  apiKeyHeaderName?: string;
  apiKeyLocation?: 'header' | 'query';
};

export type BearerAuth = {
  type: 'bearer';
  token?: string;
};

export type BasicAuth = {
  type: 'basic';
  username?: string;
  password?: string;
};

export type ApiRequestAuth =
  | { type: 'none' }
  | ApiKeyAuth
  | BearerAuth
  | BasicAuth;
  
export type FormUrlEncodedPair = { id: string; key: string; value: string };

export type RequestBody = 
    | { type: 'none'; content: '' }
    | { type: 'json'; content: string }
    | { type: 'form-urlencoded'; content: FormUrlEncodedPair[] };

export type ApiRequestData = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    apiUrl?: string;
    auth?: ApiRequestAuth;
    headers?: { id: string, key: string, value: string }[];
    body?: RequestBody;
};

export type EmailData = {
  to?: string;
  from?: string;
  subject?: string;
  body?: string;
};

export const DatabaseQueryInputSchema = z.object({
  credentialId: z.string().describe('The ID of the credential for the database connection.'),
  query: z.string().describe('The SQL query to execute.'),
  dataContext: z.record(z.any()).optional().describe('The data context from previous steps to resolve variables in the query.'),
});
export type DatabaseQueryInput = z.infer<typeof DatabaseQueryInputSchema>;

export const DatabaseQueryOutputSchema = z.object({
  success: z.boolean().describe('Whether the query was successful.'),
  rows: z.array(z.record(z.any())).describe('The rows returned by the query.'),
  error: z.string().optional().describe('An error message if the query failed.'),
});
export type DatabaseQueryOutput = z.infer<typeof DatabaseQueryOutputSchema>;

export type DatabaseQueryData = {
    credentialId?: string;
    query?: string;
}

export type AppTriggerData = {
    app?: string;
    event?: string;
};

export type AppActionData = {
    app?: string;
    action?: string;
    params?: Record<string, any>;
};

export const RuleSchema = z.object({
  id: z.string(),
  variable: z.string().describe("The variable from the context to check, e.g., 'trigger.data.name'."),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'greater_than', 'less_than']),
  value: z.string().describe("The value to compare against."),
});
export type Rule = z.infer<typeof RuleSchema>;

export const CaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    rules: z.array(RuleSchema),
    logicalOperator: z.enum(['AND', 'OR']),
    nextStepId: z.string().optional().describe("The ID of the next step to execute if this case matches."),
});
export type Case = z.infer<typeof CaseSchema>;

export const ConditionInputSchema = z.object({
  cases: z.array(CaseSchema),
  dataContext: z.record(z.any()).describe('The data context from previous steps to evaluate against.'),
});
export type ConditionInput = z.infer<typeof ConditionInputSchema>;

export const ConditionOutputSchema = z.object({
  outcome: z.string().describe('The name of the first matching case, or "default" if none match.'),
});
export type ConditionOutput = z.infer<typeof ConditionOutputSchema>;

export type ConditionData = {
  cases: Case[];
  defaultNextStepId?: string;
};

export const RunWorkflowInputSchema = z.object({
  steps: z.any().describe("An array of workflow step objects."),
});
export type RunWorkflowInput = z.infer<typeof RunWorkflowInputSchema>;

export const RunWorkflowOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    finalDataContext: z.record(z.any()).optional(),
});
export type RunWorkflowOutput = z.infer<typeof RunWorkflowOutputSchema>;


export type StepData = WaitData & ShopifyTriggerData & ApiRequestData & EmailData & DatabaseQueryData & AppTriggerData & AppActionData & ConditionData & {
    nextStepId?: string;
    webhookUrl?: string;
    events?: WebhookEvent[];
    selectedEventId?: string | null;
    cronString?: string;
    scheduleMode?: 'cron' | 'interval' | 'daily' | 'weekly' | 'monthly';
    scheduleIntervalValue?: number;
    scheduleIntervalUnit?: 'minutes' | 'hours' | 'days';
    scheduleTime?: string;
    scheduleWeeklyDays?: OfficeHoursDay[];
    scheduleMonthlyDates?: number[];
};

export type WorkflowStepData = {
  id: string;
  type: 'trigger' | 'action';
  icon: IconName;
  title: string;
  description: string;
  content?: {
    code: string;
    language: string;
  };
  errorMessage?: {
    title: string;
    description: string;
  };
  status?: 'success' | 'warning' | 'error' | 'default';
  data?: StepData;
};

export type WorkflowVersion = {
  version: number;
  date: string; // ISO string
  steps: WorkflowStepData[];
}

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Published';
  steps: WorkflowStepData[];
  version: number;
  history: WorkflowVersion[];
  nodes?: Node[];
  edges?: Edge[];
};

export type Credential = {
    id: string;
    appName: string;
    accountName: string;
    type: 'API_KEY' | 'OAuth';
    authData: {
        apiKey?: string;
        apiSecret?: string;
    };
};
