'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  Webhook,
  Timer,
  Play,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WorkflowRunRecord, StepLog } from '@/services/runs';
import type { RunStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Runs Page — Workflow execution history + step-level logs
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RunStatus, { icon: React.ElementType; className: string; label: string }> = {
  SUCCESS:   { icon: CheckCircle2,  className: 'text-green-600',  label: 'Success' },
  FAILED:    { icon: XCircle,       className: 'text-destructive', label: 'Failed' },
  RUNNING:   { icon: Loader2,       className: 'text-blue-500',    label: 'Running' },
  PENDING:   { icon: Clock,         className: 'text-muted-foreground', label: 'Pending' },
  CANCELLED: { icon: AlertCircle,   className: 'text-amber-500',   label: 'Cancelled' },
  TIMED_OUT: { icon: Timer,         className: 'text-orange-500',  label: 'Timed Out' },
};

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  webhook: Webhook,
  cron:    Clock,
  manual:  Play,
  api:     Activity,
};

function RunStatusBadge({ status }: { status: RunStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${cfg.className}`}>
      <Icon className={`h-4 w-4 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </div>
  );
}

function StepLogRow({ log }: { log: StepLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.input !== undefined || log.output !== undefined || Boolean(log.error);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        disabled={!hasDetails}
      >
        {log.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
        {log.status === 'failed' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
        {log.status === 'running' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />}
        {log.status === 'skipped' && <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{log.stepTitle}</p>
          {log.error && <p className="text-xs text-destructive mt-0.5 truncate">{log.error}</p>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {log.durationMs !== undefined && (
            <span className="text-xs text-muted-foreground">{log.durationMs}ms</span>
          )}
          {hasDetails && (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {expanded && hasDetails && (
        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
          {log.input !== undefined && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">INPUT</p>
              <pre className="text-xs bg-background rounded-md p-2 overflow-auto max-h-40 border">
                {JSON.stringify(log.input, null, 2)}
              </pre>
            </div>
          )}
          {log.output !== undefined && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">OUTPUT</p>
              <pre className="text-xs bg-background rounded-md p-2 overflow-auto max-h-40 border">
                {JSON.stringify(log.output, null, 2)}
              </pre>
            </div>
          )}
          {log.error && (
            <div>
              <p className="text-xs font-semibold text-destructive mb-1">ERROR</p>
              <pre className="text-xs bg-destructive/5 text-destructive rounded-md p-2 border border-destructive/20">
                {log.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunCard({ run }: { run: WorkflowRunRecord }) {
  const [expanded, setExpanded] = useState(false);
  const TriggerIcon = TRIGGER_ICONS[run.trigger] ?? Activity;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <CardContent className="p-4 flex items-center gap-4">
          <RunStatusBadge status={run.status} />

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {(run as any).workflow?.name ?? run.workflowId}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TriggerIcon className="h-3 w-3" />
                <span className="capitalize">{run.trigger}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
              </span>
              {run.durationMs !== null && (
                <span className="text-xs text-muted-foreground">
                  {(run.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs font-mono">
              {run.id.slice(-8)}
            </Badge>
            {expanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          {run.error && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="font-semibold mb-1">Run failed:</p>
              {run.error}
            </div>
          )}

          {run.stepLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No step logs recorded.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step Execution ({run.stepLogs.length} steps)
              </p>
              {run.stepLogs.map((log) => (
                <StepLogRow key={log.executionId ?? log.stepId} log={log} />
              ))}
            </div>
          )}

          {run.inngestRunId && (
            <a
              href={`https://app.inngest.com/runs/${run.inngestRunId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              View in Inngest dashboard →
            </a>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/runs/${run.id}`}>Open run details</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function RunsPage() {
  const [runs, setRuns] = useState<WorkflowRunRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadRuns = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/runs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load workflow runs.');
      setRuns(data.runs ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load workflow runs.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const hasActiveRuns = runs.some((run) => run.status === 'RUNNING' || run.status === 'PENDING');
  useEffect(() => {
    if (!hasActiveRuns) return;
    const interval = setInterval(() => loadRuns(false), 10_000);
    return () => clearInterval(interval);
  }, [hasActiveRuns, loadRuns]);

  const filtered = runs.filter((r) =>
    !search || (r as any).workflow?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: runs.length,
    success: runs.filter((r) => r.status === 'SUCCESS').length,
    failed: runs.filter((r) => r.status === 'FAILED').length,
    running: runs.filter((r) => r.status === 'RUNNING').length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Workflow Runs</h1>
          <p className="text-muted-foreground">Execution history and step-level logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadRuns()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Runs', value: stats.total, icon: Activity, color: 'text-foreground' },
          { label: 'Successful', value: stats.success, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-destructive' },
          { label: 'Running', value: stats.running, icon: Loader2, color: 'text-blue-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by workflow name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="RUNNING">Running</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Runs list */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-20" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No runs found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {runs.length === 0
                  ? 'Publish a workflow and trigger it to see runs here.'
                  : 'No runs match your current filters.'}
              </p>
              {runs.length === 0 && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/workflows">Go to Workflows</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filtered.map((run) => <RunCard key={run.id} run={run} />)
        )}
      </div>
    </div>
  );
}
