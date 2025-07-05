'use client';

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

const logs = [
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
    id: 'exec_1',
    timestamp: '2023-10-27T10:00:05Z',
    level: 'ERROR',
    message: 'Step 2: [Send Email] failed. SMTP connection error.',
  },
   {
    id: 'exec_2',
    timestamp: '2023-10-27T10:05:15Z',
    level: 'ERROR',
    message: 'Step 1: [Query Database] failed. Connection timeout.',
  },
  {
    id: 'exec_3',
    timestamp: '2023-10-27T10:10:00Z',
    level: 'INFO',
    message: 'Workflow "Onboarding Email Sequence" triggered for user_456.',
  },
  {
    id: 'exec_3',
    timestamp: '2023-10-27T10:10:01Z',
    level: 'SUCCESS',
    message: 'Workflow completed successfully.',
  },
];

export function MonitoringPanel() {
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'destructive';
      case 'SUCCESS':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className='font-headline'>Execution Logs</CardTitle>
            <CardDescription>Real-time monitoring of workflow executions.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh] rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[120px]">Execution ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                        <Badge variant={getBadgeVariant(log.level)}>{log.level}</Badge>
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell className="font-mono text-xs">{log.id}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
