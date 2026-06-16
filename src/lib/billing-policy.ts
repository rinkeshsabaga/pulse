export type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export type PlanLimits = {
  displayName: string;
  price: { monthly: number; yearly: number };
  workflows: number;
  runsPerMonth: number;
  stepsPerWorkflow: number;
  teamMembers: number;
  retentionDays: number;
  features: string[];
};

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  FREE: {
    displayName: 'Free',
    price: { monthly: 0, yearly: 0 },
    workflows: 3,
    runsPerMonth: 100,
    stepsPerWorkflow: 5,
    teamMembers: 1,
    retentionDays: 7,
    features: ['3 workflows', '100 runs/month', 'Webhook triggers', 'Basic integrations'],
  },
  STARTER: {
    displayName: 'Starter',
    price: { monthly: 2900, yearly: 29000 },
    workflows: 20,
    runsPerMonth: 5_000,
    stepsPerWorkflow: 20,
    teamMembers: 3,
    retentionDays: 30,
    features: [
      '20 workflows',
      '5,000 runs/month',
      'All integrations',
      '3 team members',
      '30-day log history',
    ],
  },
  PRO: {
    displayName: 'Pro',
    price: { monthly: 9900, yearly: 99000 },
    workflows: -1,
    runsPerMonth: 50_000,
    stepsPerWorkflow: -1,
    teamMembers: 10,
    retentionDays: 90,
    features: [
      'Unlimited workflows',
      '50,000 runs/month',
      'Unlimited steps',
      '10 team members',
      '90-day log history',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    displayName: 'Enterprise',
    price: { monthly: -1, yearly: -1 },
    workflows: -1,
    runsPerMonth: -1,
    stepsPerWorkflow: -1,
    teamMembers: -1,
    retentionDays: 365,
    features: [
      'Unlimited everything',
      'Unlimited team members',
      '365-day log history',
      'SSO / SAML',
      'Dedicated support',
      'Custom SLA',
    ],
  },
};

export type BillingStatus =
  | 'free'
  | 'active'
  | 'trialing'
  | 'incomplete'
  | 'past_due'
  | 'unpaid'
  | 'paused'
  | 'canceled';

export type SubscriptionEntitlement = {
  plan: PlanName;
  billingStatus: BillingStatus;
  canUsePaidEntitlements: boolean;
  paymentIssue: boolean;
};

export const PAYMENT_BLOCKED_STATUSES = new Set<BillingStatus>([
  'incomplete',
  'past_due',
  'unpaid',
  'paused',
]);

export function getPlanLimits(plan: PlanName): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

export function getRetentionCutoff(retentionDays: number, now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
  return cutoff;
}

export function assertStepLimit(plan: PlanName, stepCount: number) {
  const limits = PLAN_LIMITS[plan];
  if (isUnlimited(limits.stepsPerWorkflow)) return;
  if (stepCount > limits.stepsPerWorkflow) {
    throw new Error(
      `The ${limits.displayName} plan supports up to ${limits.stepsPerWorkflow} steps per workflow. Remove steps or upgrade to continue.`
    );
  }
}

export function deriveSubscriptionEntitlement(args: {
  status?: string | null;
  priceId?: string | null;
  planFromPrice?: PlanName | null;
}): SubscriptionEntitlement {
  const status = normalizeBillingStatus(args.status);
  const paidPlan = args.priceId && args.planFromPrice ? args.planFromPrice : null;

  if ((status === 'active' || status === 'trialing') && paidPlan) {
    return {
      plan: paidPlan,
      billingStatus: status,
      canUsePaidEntitlements: true,
      paymentIssue: false,
    };
  }

  return {
    plan: 'FREE',
    billingStatus: status,
    canUsePaidEntitlements: false,
    paymentIssue: PAYMENT_BLOCKED_STATUSES.has(status),
  };
}

export function normalizeBillingStatus(status?: string | null): BillingStatus {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'incomplete':
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return status;
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'free';
  }
}

