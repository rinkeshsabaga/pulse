
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance, differenceInSeconds } from 'date-fns';

const rawLogs = [
  // Execution 1 (Error)
  {
    id: 'exec_1',
    timestamp: '2023-10-27T10:00:01Z',
    level: 'INFO',
    message: 'Workflow "Onboarding Email Sequence" triggered for user_123.',
  },
  {
    id: 'exec_1',
    timestamp: '2023-10-27T10:00:02Z',
    level: 'INFO',
    message: 'Step 1: [Generate Welcome Email] started.',
  },
  {
    id: 'exec_1',
    timestamp: '2023-10-27T10:00:03Z',
    level: 'SUCCESS',
    message: 'Step 1: [Generate Welcome Email] completed successfully.',
  },
  {
    id: 'exec_1',
    timestamp: '2023-10-27T10:00:04Z',
    level: 'INFO',
    message: 'Step 2: [Send Email] started.',
  },
  {
    id: 'exec_1',
    timestamp: '2023-10-27T10:00:05Z',
    level: 'ERROR',
    message: 'Step 2: [Send Email] failed. SMTP connection error.',
  },

  // Execution 2 (Error)
  {
    id: 'exec_2',
    timestamp: '2023-10-27T10:05:10Z',
    level: 'INFO',
    message: 'Workflow "Daily Report" triggered.',
  },
  {
    id: 'exec_2',
    timestamp: '2023-10-27T10:05:11Z',
    level: 'INFO',
    message: 'Step 1: [Query Database] started.',
  },
   {
    id: 'exec_2',
    timestamp: '2023-10-27T10:05:15Z',
    level: 'ERROR',
    message: 'Step 1: [Query Database] failed. Connection timeout.',
  },

  // Execution 3 (Success)
  {
    id: 'exec_3',
    timestamp: '2023-10-27T10:10:00Z',
    level: 'INFO',
    message: 'Workflow "Onboarding Email Sequence" triggered for user_456.',
  },
  {
    id: 'exec_3',
    timestamp: '2023-10-27T10:10:05Z',
    level: 'SUCCESS',
    message: 'Workflow completed successfully.',
  },
];


export function MonitoringPanel() {
  const [openExecutionId, setOpenExecutionId] = useState<string | null>(null);

  const executions = useMemo(() => {
    const groupedLogs = rawLogs.reduce((acc, log) => {
      if (!acc[log.id]) {
        acc[log.id] = [];
      }
      acc[log.id].push({
        ...log,
        date: new Date(log.timestamp)
      });
      return acc;
    }, {} as Record<string, (typeof rawLogs[0] & { date: Date })[]>);
    
    return Object.values(groupedLogs).map(logs => {
        const sortedLogs = logs.sort((a,b) => a.date.getTime() - b.date.getTime());
        const firstLog = sortedLogs[0];
        const lastLog = sortedLogs[sortedLogs.length - 1];
        const status = lastLog.level === 'ERROR' ? 'Error' : 'Success';
        const duration = differenceInSeconds(lastLog.date, firstLog.date);

        return {
            id: firstLog.id,
            startTime: firstLog.date,
            status,
            duration,
            logs: sortedLogs,
        }
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, []);

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'Error':
      case 'ERROR':
        return 'destructive';
      case 'Success':
      case 'SUCCESS':
        return 'default';
      default:
        return 'secondary';
    }
  };
  
  const handleToggle = (id: string) => {
    setOpenExecutionId(prevId => prevId === id ? null : id);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className='font-headline'>Execution Logs</CardTitle>
            <CardDescription>Real-time monitoring of workflow executions. Click a row to see details.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh] rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[180px]">Started</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[120px]">Duration</TableHead>
                      <TableHead>Execution ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {executions.map((exec) => (
                    <Collapsible asChild key={exec.id} open={openExecutionId === exec.id} onOpenChange={() => handleToggle(exec.id)}>
                        <>
                        <CollapsibleTrigger asChild>
                             <TableRow className="cursor-pointer">
                                <TableCell>
                                    <ChevronRight className={cn("h-4 w-4 transition-transform", openExecutionId === exec.id && "rotate-90")} />
                                </TableCell>
                                <TableCell>
                                    {formatDistance(exec.startTime, new Date(), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getBadgeVariant(exec.status)}>{exec.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    {exec.duration}s
                                </TableCell>
                                <TableCell className="font-mono text-xs">{exec.id}</TableCell>
                            </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                            <tr className="bg-muted/50 hover:bg-muted/50">
                                <TableCell colSpan={5} className="p-0">
                                    <div className="p-4">
                                        <Table>
                                             <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Timestamp</TableHead>
                                                    <TableHead className="w-[100px]">Level</TableHead>
                                                    <TableHead>Message</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {exec.logs.map((log) => (
                                                    <TableRow key={log.timestamp}>
                                                        <TableCell className="font-mono text-xs">{log.date.toLocaleString()}</TableCell>
                                                        <TableCell><Badge variant={getBadgeVariant(log.level)}>{log.level}</Badge></TableCell>
                                                        <TableCell>{log.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TableCell>
                            </tr>
                        </CollapsibleContent>
                        </>
                    </Collapsible>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
