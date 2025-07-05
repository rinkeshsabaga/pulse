
import type { ReactElement, ElementType } from 'react';

export type IconName =
  | 'Webhook'
  | 'Mail'
  | 'FlaskConical'
  | 'Database'
  | 'ArrowRightLeft'
  | 'GitMerge'
  | 'Filter'
  | 'Clock'
  | 'ShoppingCart'
  | 'StopCircle'
  | 'Code'
  | 'AppWindow';

export type ApiRequestAuth = {
    type: 'none' | 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyLocation?: 'header' | 'query';
    apiKeyHeaderName?: string;
};

export type FormUrlEncodedPair = {
  id: string;
  key: string;
  value: string;
};

export type RequestBody = {
  type: 'none' | 'json' | 'form-urlencoded';
  content: string | FormUrlEncodedPair[];
};

export type ShopifyEvent =
  | 'abandoned_checkout'
  | 'order_placed'
  | 'order_fulfilled'
  | 'order_cancelled'
  | 'refund_initiated'
  | 'order_shipment'
  | 'order_updated';

export type ShopifySubEvent =
  | 'shipment_in_transit'
  | 'shipment_out_for_delivery'
  | 'shipment_delivered'
  | 'update_tags_added'
  | 'update_tags_removed'
  | 'update_line_items_changed';

export type WaitMode = 'duration' | 'datetime' | 'office_hours' | 'timestamp' | 'specific_day';
export type OfficeHoursDay = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type AppActionData = {
  app: string;
  action: string;
  params?: Record<string, any>;
};

export type FilterCondition = {
  id: string;
  variable: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: string;
};

export type FilterData = {
  conditions: FilterCondition[];
  logicalOperator: 'AND' | 'OR';
};

export type ApiRequestData = {
    webhookUrl?: string; // for trigger
    // for Shopify Trigger
    shopifyEvent?: ShopifyEvent;
    shopifySubEvent?: ShopifySubEvent;
    // for App Trigger
    appTrigger?: {
      app: string;
      event: string;
    };
    // for App Action
    appAction?: AppActionData;
    // for API Request action
    apiUrl?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: { id: string; key: string; value: string }[];
    body?: RequestBody;
    auth?: ApiRequestAuth;
    // for Wait action
    waitMode?: WaitMode;
    waitDurationValue?: number;
    waitDurationUnit?: 'minutes' | 'hours' | 'days';
    waitDateTime?: string; // ISO
    waitOfficeHoursDays?: OfficeHoursDay[];
    waitOfficeHoursStartTime?: string; // HH:mm
    waitOfficeHoursEndTime?: string; // HH:mm
    waitOfficeHoursAction?: 'wait' | 'proceed';
    waitTimestamp?: string;
    waitSpecificDays?: OfficeHoursDay[];
    waitSpecificTime?: string; // HH:mm
    // for Filter action
    filterData?: FilterData;
}


export type WorkflowStepData = {
  id: string;
  type: 'trigger' | 'action';
  icon: IconName;
  title: string;
  description: string;
  data?: ApiRequestData;
  content?: {
    code: string;
    language: string;
  };
  errorMessage?: {
    title: string;
    description: string;
  };
  status?: 'success' | 'warning' | 'error' | 'default';
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Published';
  steps: WorkflowStepData[];
};

export type CredentialType = 'OAuth' | 'API_KEY';

export type CredentialAuthData = {
  apiKey?: string;
  apiSecret?: string;
  // For OAuth, these would be populated by the OAuth flow.
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp in milliseconds
  // Other potential fields
  instanceUrl?: string; // e.g., for Salesforce
  clientId?: string;
  clientSecret?: string;
};

export type Credential = {
  id: string;
  appName: string;
  type: CredentialType;
  accountName: string;
  authData: CredentialAuthData;
};
