import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
  Activity, AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, Timer, XCircle,
} from 'lucide-react';
import type { RunStatus } from '@prisma/client';
import { getWorkflowRunById, type StepLog } from '@/services/runs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_CONFIG: Record<RunStatus, { icon: React.ElementType; className: string; label: string }> = {
  SUCCESS: { icon: CheckCircle2, className: 'text-green-600', label: 'Success' },
  FAILED: { icon: XCircle, className: 'text-destructive', label: 'Failed' },
  RUNNING: { icon: Loader2, className: 'text-blue-500', label: 'Running' },
  PENDING: { icon: Clock, className: 'text-muted-foreground', label: 'Pending' },
  CANCELLED: { icon: AlertCircle, className: 'text-amber-500', label: 'Cancelled' },
  TIMED_OUT: { icon: Timer, className: 'text-orange-500', label: 'Timed Out' },
};

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = await getWorkflowRunById(runId);
  if (!run) notFound();

  const status = STATUS_CONFIG[run.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
            <Link href="/runs"><ArrowLeft className="mr-2 h-4 w-4" />Back to runs</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-headline">{run.workflow?.name ?? 'Workflow Run'}</h1>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${status.className}`}>
              <StatusIcon className={`h-4 w-4 ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
              {status.label}
            </div>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{run.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/workflows/${run.workflowId}`}>Open workflow</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Trigger" value={capitalize(run.trigger)} />
        <Metric label="Started" value={format(new Date(run.startedAt), 'PP p')} />
        <Metric label="Finished" value={run.finishedAt ? format(new Date(run.finishedAt), 'PP p') : 'In progress'} />
        <Metric label="Duration" value={formatDuration(run.durationMs)} />
      </div>

      {run.error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader><CardTitle className="text-base text-destructive">Run Error</CardTitle></CardHeader>
          <CardContent><pre className="whitespace-pre-wrap text-sm text-destructive">{run.error}</pre></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trigger Input</CardTitle>
          <CardDescription>Payload persisted when this run was created.</CardDescription>
        </CardHeader>
        <CardContent><JsonBlock value={run.triggerData ?? {}} /></CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Step Execution</h2>
          <p className="text-sm text-muted-foreground">Input, output, duration, execution ID, and errors for every recorded step.</p>
        </div>
        {run.stepLogs.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No step logs have been recorded.</CardContent></Card>
        ) : run.stepLogs.map((log, index) => <StepDetail key={log.executionId || `${log.stepId}-${index}`} log={log} index={index} />)}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></CardContent></Card>
  );
}

function StepDetail({ log, index }: { log: StepLog; index: number }) {
  const failed = log.status === 'failed';
  return (
    <Card className={failed ? 'border-destructive/40' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {failed ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {index + 1}. {log.stepTitle}
            </CardTitle>
            <CardDescription className="mt-1 font-mono">{log.executionId}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={failed ? 'destructive' : 'secondary'}>{log.status}</Badge>
            <Badge variant="outline">{formatDuration(log.durationMs ?? null)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {log.error && <div><DataLabel>Error</DataLabel><pre className="whitespace-pre-wrap rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{log.error}</pre></div>}
        <div className="grid gap-4 lg:grid-cols-2">
          <div><DataLabel>Input</DataLabel><JsonBlock value={log.input ?? null} /></div>
          <div><DataLabel>Output</DataLabel><JsonBlock value={log.output ?? null} /></div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Started: {formatTimestamp(log.startedAt)}</span>
          <span>Finished: {formatTimestamp(log.finishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DataLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>;
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return 'Not finished';
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(2)}s`;
  return `${Math.floor(durationMs / 60_000)}m ${Math.round((durationMs % 60_000) / 1000)}s`;
}

function formatTimestamp(value?: string): string {
  return value ? format(new Date(value), 'PP p') : 'Not recorded';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
