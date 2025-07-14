
'use client';

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
import {
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';
import {
    ChartTooltipContent,
    ChartContainer,
    type ChartConfig
} from '@/components/ui/chart';

const chartData = [
  { date: 'Mon', runs: Math.floor(Math.random() * 200) + 50 },
  { date: 'Tue', runs: Math.floor(Math.random() * 200) + 50 },
  { date: 'Wed', runs: Math.floor(Math.random() * 200) + 50 },
  { date: 'Thu', runs: Math.floor(Math.random() * 200) + 50 },
  { date: 'Fri', runs: Math.floor(Math.random() * 200) + 50 },
  { date: 'Sat', runs: Math.floor(Math.random() * 200) + 50 },
  { date: 'Sun', runs: Math.floor(Math.random() * 200) + 50 },
];

const chartConfig = {
  runs: {
    label: "Workflow Runs",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const recentWorkflows = [
    { id: 'wf_1', name: 'Onboarding Email Sequence', status: 'Published', lastModified: '3 hours ago' },
    { id: 'wf_3', name: 'Failed Payment Alert', status: 'Draft', lastModified: '1 day ago' },
    { id: 'wf_2', name: 'Daily Report', status: 'Published', lastModified: '2 days ago' },
];

export default function HomePage() {
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 since last month
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
            <div className="text-2xl font-bold">+1,234</div>
            <p className="text-xs text-muted-foreground">
              98% success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used (Month)</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,732</div>
            <p className="text-xs text-muted-foreground">
              57% of your monthly quota
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
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={30}
                    />
                    <ChartTooltipContent />
                    <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
                </BarChart>
            </ChartContainer>
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
                {recentWorkflows.map((wf) => (
                    <TableRow key={wf.id}>
                        <TableCell>
                            <Link href={`/workflows/${wf.id}`} className="font-medium hover:underline">
                                {wf.name}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Badge variant={wf.status === 'Draft' ? 'secondary' : 'default'}>
                                {wf.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{wf.lastModified}</TableCell>
                    </TableRow>
                ))}
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
