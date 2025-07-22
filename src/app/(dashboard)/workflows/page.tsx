
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { MoreHorizontal, FolderPlus, Plus, Workflow, Edit, Copy, Trash2, Eye } from 'lucide-react';
import { CreateWorkflowDialog } from '@/components/create-workflow-dialog';
import { RenameWorkflowDialog } from '@/components/rename-workflow-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getWorkflows, deleteWorkflow, duplicateWorkflow } from '@/lib/db';
import type { Workflow as WorkflowType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [workflowToRename, setWorkflowToRename] = useState<WorkflowType | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowType | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { toast } = useToast();

  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    // In a real app, you'd get the org ID from the user's session
    const allWorkflows = await getWorkflows();
    setWorkflows(allWorkflows);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);
  
  const handleRename = () => {
    loadWorkflows();
  }

  const handleDelete = async () => {
    if (!workflowToDelete || deleteConfirmation !== workflowToDelete.name) return;
    
    // In a real app, you'd get the org ID from the user's session
    await deleteWorkflow(workflowToDelete.id);
    setWorkflows(prev => prev.filter((wf) => wf.id !== workflowToDelete.id));

    toast({
      title: 'Workflow Deleted',
      description: `"${workflowToDelete.name}" has been successfully deleted.`,
    });
    setWorkflowToDelete(null);
    setDeleteConfirmation('');
  };

  const handleDuplicate = async (workflowToDuplicate: WorkflowType) => {
    try {
        // In a real app, you'd get the org ID from the user's session
        await duplicateWorkflow(workflowToDuplicate.id);
        toast({
            title: 'Workflow Duplicated',
            description: `A copy of "${workflowToDuplicate.name}" has been created.`,
        });
        loadWorkflows();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Duplicating Workflow',
            description: 'Could not duplicate the workflow. Please try again.',
        });
    }
  }


  const showNotImplementedToast = (feature: string) => {
    toast({
        title: "Coming Soon!",
        description: `${feature} functionality is not yet implemented.`
    })
  }
  
  const handleOpenDeleteDialog = (workflow: WorkflowType) => {
    setWorkflowToDelete(workflow);
    setDeleteConfirmation('');
  }

  const handleCloseDeleteDialog = () => {
    setWorkflowToDelete(null);
    setDeleteConfirmation('');
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">Workflows</h1>
            <p className="text-muted-foreground">Manage your workflows</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => showNotImplementedToast('Create Folder')}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            workflows.map((workflow) => (
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
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      )}
                      <Badge variant={workflow.status === 'Draft' ? 'secondary' : 'default'} className="mt-1">
                        {workflow.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/workflows/${workflow.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
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
                        <DropdownMenuItem asChild>
                          <Link href={`/workflows/${workflow.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setWorkflowToRename(workflow)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(workflow)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleOpenDeleteDialog(workflow)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <CreateWorkflowDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        onWorkflowCreated={loadWorkflows}
      />
      <RenameWorkflowDialog
        open={!!workflowToRename}
        onOpenChange={() => setWorkflowToRename(null)}
        onWorkflowRenamed={handleRename}
        workflow={workflowToRename}
      />
       <AlertDialog 
        open={!!workflowToDelete} 
        onOpenChange={(open) => !open && handleCloseDeleteDialog()}
      >
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                <span className="font-semibold"> "{workflowToDelete?.name}"</span> workflow.
                <br/><br/>
                To confirm, please type the name of the workflow below.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 space-y-2">
                <Label htmlFor="delete-confirm" className="sr-only">Workflow Name</Label>
                <Input 
                    id="delete-confirm"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={workflowToDelete?.name}
                    autoComplete="off"
                />
            </div>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteConfirmation !== workflowToDelete?.name}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
