
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, FileText, FolderPlus, Plus, Workflow } from 'lucide-react';

const mockWorkflows = [
  { id: 'wf_1', name: 'Rinkesh Singh', status: 'Draft' },
  { id: 'wf_2', name: 'hjyfgjugu', status: 'Draft' },
  { id: 'wf_3', name: 'Rinkesh', status: 'Published' },
  { id: 'wf_4', name: 'Daily Report', status: 'Published' },
];

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Workflows</h1>
          <p className="text-muted-foreground">Manage your workflows</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
          <Button asChild>
            <Link href="/workflows/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {mockWorkflows.map((workflow) => (
          <Card key={workflow.id} className="hover:bg-card/95">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-lg">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Link href={`/workflows/${workflow.id}`} className="font-semibold hover:underline">
                    {workflow.name}
                  </Link>
                  <Badge variant={workflow.status === 'Draft' ? 'secondary' : 'default'} className="ml-2">
                    {workflow.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workflows/${workflow.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View</DropdownMenuItem>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
