
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
import { AppWindow, ArrowLeft } from 'lucide-react';
import type { WorkflowStepData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { APP_DEFINITIONS } from '@/lib/app-definitions';
import { Textarea } from './ui/textarea';

type EditAppActionDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

export function EditAppActionDialog({ step, open, onOpenChange, onSave }: EditAppActionDialogProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      setSelectedApp(step.data?.appAction?.app || null);
      setSelectedAction(step.data?.appAction?.action || null);
      setParams(step.data?.appAction?.params || {});
    }
  }, [open, step.data]);

  const appDefinition = useMemo(() => {
    return APP_DEFINITIONS.find(app => app.name === selectedApp);
  }, [selectedApp]);

  const handleSave = () => {
    if (!selectedApp || !selectedAction) return;

    const actionLabel = appDefinition?.actions.find(a => a.value === selectedAction)?.label || 'App Action';
    
    const updatedStep: WorkflowStepData = {
      ...step,
      title: `${selectedApp} Action`,
      description: actionLabel,
      data: {
        ...step.data,
        appAction: {
          app: selectedApp,
          action: selectedAction,
          params: params,
        },
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const handleAppSelect = (appName: string) => {
    setSelectedApp(appName);
    setSelectedAction(null); // Reset action when app changes
    setParams({});
  };

  const renderAppSelection = () => (
    <>
      <DialogDescription>
        Choose an application to perform an action.
      </DialogDescription>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
        {APP_DEFINITIONS.map((app) => (
          <Card 
            key={app.name} 
            className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent hover:border-primary transition-colors"
            onClick={() => handleAppSelect(app.name)}
          >
            <app.icon className={cn("h-8 w-8", app.iconClassName)} />
            <span className="font-semibold text-sm">{app.name}</span>
          </Card>
        ))}
      </div>
    </>
  );

  const renderActionSelection = () => {
    if (!appDefinition) return null;
    const AppIcon = appDefinition.icon;

    return (
      <>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedApp(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <AppIcon className={cn("h-8 w-8", appDefinition.iconClassName)} />
            <div>
                <DialogTitle className='text-lg'>Configure Action for {appDefinition.name}</DialogTitle>
                <DialogDescription>Select the action to perform in the workflow.</DialogDescription>
            </div>
          </div>
        </div>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="app-action">Action</Label>
                <Select value={selectedAction || ''} onValueChange={(v) => setSelectedAction(v)}>
                    <SelectTrigger id="app-action">
                        <SelectValue placeholder="Select an action" />
                    </SelectTrigger>
                    <SelectContent>
                        {appDefinition.actions.map(action => (
                            <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {selectedAction && (
                <div className="space-y-2">
                    <Label>Parameters (as JSON)</Label>
                    <Textarea 
                        placeholder={'{\n  "channel": "#general",\n  "text": "Hello, World!"\n}'}
                        rows={6}
                        value={JSON.stringify(params, null, 2)}
                        onChange={(e) => {
                            try {
                                setParams(JSON.parse(e.target.value));
                            } catch (error) {
                                // Maybe show an error to the user in the future
                            }
                        }}
                        className="font-code text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                        Provide action parameters in JSON format. This will be replaced with a dynamic form later.
                    </p>
                </div>
            )}
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
            Configure App Action
          </DialogTitle>
        </DialogHeader>
        
        {selectedApp ? renderActionSelection() : renderAppSelection()}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedApp || !selectedAction}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
