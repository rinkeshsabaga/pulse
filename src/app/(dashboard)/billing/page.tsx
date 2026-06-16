'use client';

import React, { useEffect, useState } from 'react';
import { useOrganization } from '@clerk/nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Zap, Check, ArrowUpRight, CreditCard, Loader2, Users, Workflow, Activity, GitCommit, History } from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/billing-policy';
import type { PlanName } from '@/lib/billing-policy';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Billing Page
// Shows current plan, usage meters, and upgrade options.
// ─────────────────────────────────────────────────────────────────────────────

type UsageSummary = {
  plan: PlanName;
  limits: typeof PLAN_LIMITS.FREE;
  usage: {
    runs: { used: number; limit: number };
    workflows: { used: number; limit: number };
    members: { used: number; limit: number };
    stepsPerWorkflow: { used: number; limit: number };
    retentionDays: { used: number; limit: number };
  };
};

const ALL_PLANS: PlanName[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const PLAN_CTA: Record<PlanName, string> = {
  FREE: 'Upgrade to Starter',
  STARTER: 'Upgrade to Pro',
  PRO: 'Talk to Sales',
  ENTERPRISE: 'Current Plan',
};

function UsageMeter({
  label,
  icon: Icon,
  used,
  limit,
}: {
  label: string;
  icon: React.ElementType;
  used: number;
  limit: number;
}) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isWarning = !unlimited && pct >= 80;
  const isOver = !unlimited && pct >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <span className={isOver ? 'text-destructive font-semibold' : 'font-medium'}>
          {used.toLocaleString()}{' '}
          <span className="text-muted-foreground font-normal">
            / {unlimited ? '∞' : limit.toLocaleString()}
          </span>
        </span>
      </div>
      {!unlimited && (
        <Progress
          value={pct}
          className={`h-1.5 ${isWarning ? '[&>div]:bg-amber-500' : ''} ${isOver ? '[&>div]:bg-destructive' : ''}`}
        />
      )}
    </div>
  );
}

function LimitValue({
  label,
  icon: Icon,
  value,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function BillingPage() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const currentPlan = summary?.plan ?? ((organization?.publicMetadata?.plan as string) ?? 'FREE') as PlanName;
  const limits = PLAN_LIMITS[currentPlan];

  useEffect(() => {
    fetch('/api/usage/summary')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load usage.');
        return data;
      })
      .then((data) => setSummary(data))
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Could not load billing usage',
          description: error instanceof Error ? error.message : 'Usage data is unavailable.',
        });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  const handleUpgrade = async (targetPlan: PlanName, billing: 'monthly' | 'yearly') => {
    if (targetPlan === 'ENTERPRISE') {
      window.open('mailto:sales@sabagapulse.com?subject=Enterprise Inquiry', '_blank');
      return;
    }

    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billing }),
      });
      const { url, error } = await res.json();
      if (!res.ok) throw new Error(error || 'Checkout failed.');
      if (url) window.location.href = url;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not open checkout',
        description: error instanceof Error ? error.message : 'Try again.',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const { url, error } = await res.json();
      if (!res.ok) throw new Error(error || 'Could not open billing portal.');
      if (url) window.location.href = url;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not open billing portal',
        description: error instanceof Error ? error.message : 'Try again.',
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Billing & Plans</h1>
          <p className="text-muted-foreground">Manage your subscription and usage</p>
        </div>
        {currentPlan !== 'FREE' && (
          <Button variant="outline" onClick={handleManageSubscription} disabled={isOpeningPortal}>
            {isOpeningPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription and this month's usage</CardDescription>
            </div>
            <Badge className="text-base px-3 py-1 font-semibold">
              <Zap className="mr-1.5 h-4 w-4" />
              {limits.displayName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading usage...
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <UsageMeter
                label="Workflow Runs this month"
                icon={Activity}
                used={summary.usage.runs.used}
                limit={summary.usage.runs.limit}
              />
              <UsageMeter
                label="Workflows"
                icon={Workflow}
                used={summary.usage.workflows.used}
                limit={summary.usage.workflows.limit}
              />
              <UsageMeter
                label="Team Members"
                icon={Users}
                used={summary.usage.members.used}
                limit={summary.usage.members.limit}
              />
              <UsageMeter
                label="Steps per workflow"
                icon={GitCommit}
                used={summary.usage.stepsPerWorkflow.used}
                limit={summary.usage.stepsPerWorkflow.limit}
              />
              <LimitValue
                label="Run log retention"
                icon={History}
                value={`${summary.usage.retentionDays.limit} days`}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Usage data unavailable.</p>
          )}
        </CardContent>
      </Card>

      {/* Plan Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Compare Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ALL_PLANS.map((plan) => {
            const p = PLAN_LIMITS[plan];
            const isCurrent = plan === currentPlan;
            const isDowngrade =
              ALL_PLANS.indexOf(plan) < ALL_PLANS.indexOf(currentPlan);

            return (
              <Card
                key={plan}
                className={isCurrent ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}
              >
                <CardHeader className="pb-3">
                  {isCurrent && (
                    <Badge className="w-fit mb-2" variant="default">
                      Current
                    </Badge>
                  )}
                  <CardTitle className="text-lg">{p.displayName}</CardTitle>
                  <CardDescription>
                    {p.price.monthly === 0
                      ? 'Free forever'
                      : p.price.monthly === -1
                      ? 'Custom pricing'
                      : `$${p.price.monthly / 100}/mo`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  {!isCurrent && !isDowngrade && (
                    <Button
                      className="w-full"
                      variant={plan === 'PRO' ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan, 'monthly')}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {PLAN_CTA[plan]}
                          <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                  {isCurrent && (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
