import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, PlusCircle, Workflow, CheckCircle, Zap } from 'lucide-react';
import { RunsChart } from './runs-chart';
import { getAuthContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { getRunsPerDay } from '@/services/runs';

export default async function HomePage() {
  const { dbOrgId: organizationId } = await getAuthContext();
  if (!organizationId) {
    redirect('/onboarding');
  }

  // 1. Active Workflows
  const activeWorkflowsCount = await db.workflow.count({
    where: { organizationId, status: 'PUBLISHED' },
  });

  // 2. Successful Runs (24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const successfulRuns24h = await db.workflowRun.count({
    where: {
      organizationId,
      status: 'SUCCESS',
      startedAt: { gte: oneDayAgo },
    },
  });

  // 3. Credits Used (Month)
  const currentPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const usageAggregate = await db.usageRecord.aggregate({
    _sum: { creditsUsed: true },
    where: { organizationId, period: currentPeriod },
  });
  const creditsUsed = usageAggregate._sum.creditsUsed || 0;

  // 4. Recent Workflows
  const recentWorkflows = await db.workflow.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
    },
  });

  // 5. Chart Data (persisted runs over last 7 UTC calendar days)
  const chartData = await getRunsPerDay(7);

  return (
    <div className="grid flex-1 items-start gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome Back!</h1>
          <p className="text-muted-foreground">Here's a summary of your workflow activity.</p>
        </div>
        <Button asChild>
          <Link href="/workflows">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Workflow
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workflows
            </CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflowsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total published workflows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Runs (24h)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{successfulRuns24h}</div>
            <p className="text-xs text-muted-foreground">
              Over the last 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used (Month)</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              During {new Date().toLocaleString('default', { month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Workflow Activity</CardTitle>
            <CardDescription>
                Workflow runs over the last 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RunsChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Workflows</CardTitle>
            <CardDescription>
              Quickly jump back into your recent work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      No workflows yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentWorkflows.map((wf) => (
                    <TableRow key={wf.id}>
                      <TableCell>
                        <Link href={`/workflows/${wf.id}`} className="font-medium hover:underline">
                          {wf.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wf.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {wf.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(wf.updatedAt, { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
             <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/workflows">
                    View all workflows
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
