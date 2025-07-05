
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { AppWindow, ArrowLeft, Bot, GitBranch, Github, LayoutList, MessageSquare, Sheet as SheetIcon } from 'lucide-react';
import type { WorkflowStepData } from '@/lib/types';
import { cn } from '@/lib/utils';

// Define apps and their triggers
const APP_DEFINITIONS = [
    { 
        name: 'Slack', 
        icon: MessageSquare,
        triggers: [
            { value: 'new_message', label: 'New Message in Channel' },
            { value: 'new_mention', label: 'New Mention' },
            { value: 'reaction_added', label: 'Reaction Added' },
        ],
    },
    { 
        name: 'Google Sheets', 
        icon: SheetIcon,
        triggers: [
            { value: 'new_row', label: 'New Row Added' },
            { value: 'row_updated', label: 'Row Updated' },
            { value: 'new_worksheet', label: 'New Worksheet Created' },
        ],
    },
    { 
        name: 'GitHub', 
        icon: Github,
        triggers: [
            { value: 'new_commit', label: 'New Commit on Branch' },
            { value: 'pr_opened', label: 'Pull Request Opened' },
            { value: 'new_issue', label: 'New Issue Created' },
        ],
    },
    { 
        name: 'Trello', 
        icon: LayoutList,
        triggers: [
            { value: 'card_created', label: 'New Card Created' },
            { value: 'card_moved', label: 'Card Moved to List' },
            { value: 'member_added', label: 'Member Added to Card' },
        ],
    },
    { 
        name: 'Discord', 
        icon: Bot,
        triggers: [
            { value: 'new_message', label: 'New Message in Channel' },
            { value: 'member_joined', label: 'New Member Joined Server' },
        ],
    },
    { 
        name: 'Jira', 
        icon: GitBranch,
        triggers: [
            { value: 'issue_created', label: 'Issue Created' },
            { value: 'status_updated', label: 'Issue Status Updated' },
        ],
    },
];

type EditAppTriggerDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

export function EditAppTriggerDialog({ step, open, onOpenChange, onSave }: EditAppTriggerDialogProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedApp(step.data?.appTrigger?.app || null);
      setSelectedEvent(step.data?.appTrigger?.event || null);
    }
  }, [open, step.data]);

  const appDefinition = useMemo(() => {
    return APP_DEFINITIONS.find(app => app.name === selectedApp);
  }, [selectedApp]);

  const handleSave = () => {
    if (!selectedApp || !selectedEvent) return;

    const eventLabel = appDefinition?.triggers.find(t => t.value === selectedEvent)?.label || 'App Event';
    
    const updatedStep: WorkflowStepData = {
      ...step,
      title: `${selectedApp} Event`,
      description: eventLabel,
      data: {
        ...step.data,
        appTrigger: {
          app: selectedApp,
          event: selectedEvent,
        },
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const handleAppSelect = (appName: string) => {
    setSelectedApp(appName);
    setSelectedEvent(null); // Reset event when app changes
  };

  const renderAppSelection = () => (
    <>
      <DialogDescription>
        Choose an application to trigger this workflow.
      </DialogDescription>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
        {APP_DEFINITIONS.map((app) => (
          <Card 
            key={app.name} 
            className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent hover:border-primary transition-colors"
            onClick={() => handleAppSelect(app.name)}
          >
            <app.icon className="h-8 w-8 text-muted-foreground" />
            <span className="font-semibold text-sm">{app.name}</span>
          </Card>
        ))}
      </div>
    </>
  );

  const renderEventSelection = () => {
    if (!appDefinition) return null;
    const AppIcon = appDefinition.icon;

    return (
      <>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedApp(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <AppIcon className="h-8 w-8 text-muted-foreground" />
            <div>
                <DialogTitle className='text-lg'>Configure Trigger for {appDefinition.name}</DialogTitle>
                <DialogDescription>Select the specific event that will start the workflow.</DialogDescription>
            </div>
          </div>
        </div>
        <div className="py-4 space-y-2">
            <Label htmlFor="app-event">Trigger Event</Label>
            <Select value={selectedEvent || ''} onValueChange={(v) => setSelectedEvent(v)}>
                <SelectTrigger id="app-event">
                    <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                    {appDefinition.triggers.map(trigger => (
                        <SelectItem key={trigger.value} value={trigger.value}>{trigger.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2 font-headline", selectedApp && 'hidden')}>
            <AppWindow className="text-primary" />
            Configure App Trigger
          </DialogTitle>
        </DialogHeader>
        
        {selectedApp ? renderEventSelection() : renderAppSelection()}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedApp || !selectedEvent}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
