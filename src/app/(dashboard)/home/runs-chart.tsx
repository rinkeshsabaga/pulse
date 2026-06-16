'use client';

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
import type { RunSeriesPoint } from '@/lib/run-monitoring';

const chartConfig = {
  successful: {
    label: "Successful",
    color: "hsl(var(--primary))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
  other: {
    label: "Pending / Running / Cancelled",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

export function RunsChart({ data }: { data: RunSeriesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No run data available for the selected period.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} accessibilityLayer>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(5)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={30}
        />
        <ChartTooltipContent />
        <Bar dataKey="successful" stackId="runs" fill="var(--color-successful)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="failed" stackId="runs" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="other" stackId="runs" fill="var(--color-other)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
