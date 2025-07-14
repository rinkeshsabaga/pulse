
'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, GitCommit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WorkflowVersion } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type VersionHistoryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  history: WorkflowVersion[];
  onRevert: (version: WorkflowVersion) => void;
};

export function VersionHistoryPanel({ isOpen, onClose, history, onRevert }: VersionHistoryPanelProps) {

  // Sort history from newest to oldest, ensuring history is an array.
  const sortedHistory = Array.isArray(history) 
    ? [...history].sort((a, b) => b.version - a.version)
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-headline">
            <History className="text-primary" />
            Version History
          </SheetTitle>
          <SheetDescription>
            Review and revert to previous versions of your workflow.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-80px)] mt-4 pr-4">
          <div className="space-y-6">
            {sortedHistory.map((version) => (
              <div key={version.version} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <GitCommit className="h-5 w-5 text-primary" />
                    </div>
                    {sortedHistory.length > 1 && version.version !== 1 && <div className="w-px h-16 bg-border mt-2"></div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      Version {version.version}
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button size="sm" variant="outline">Revert</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Revert to Version {version.version}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to revert to this version? Any unsaved changes in the current version will be lost. This action will create a new version based on this historical state.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRevert(version)}>
                                Revert
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {formatDistanceToNow(new Date(version.date), { addSuffix: true })}
                  </div>
                  <Badge variant="secondary">{version.steps.length} steps</Badge>
                </div>
              </div>
            ))}
             <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <div className="p-2 bg-muted rounded-full">
                        <GitCommit className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
                <div className="flex-1 pt-1">
                    <div className="font-semibold">Workflow Created</div>
                </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
