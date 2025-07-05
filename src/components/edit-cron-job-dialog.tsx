
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import type { WorkflowStepData } from '@/lib/types';
import cron from 'cron-parser';

type EditCronJobDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

export function EditCronJobDialog({ step, open, onOpenChange, onSave }: EditCronJobDialogProps) {
  const [cronString, setCronString] = useState(step.data?.cronString || '* * * * *');
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (open) {
      setCronString(step.data?.cronString || '* * * * *');
    }
  }, [open, step.data]);

  useEffect(() => {
    try {
      cron.parseExpression(cronString);
      setIsValid(true);
      setValidationMessage('This is a valid cron expression.');
    } catch (e: any) {
      setIsValid(false);
      setValidationMessage(e.message || 'Invalid cron expression');
    }
  }, [cronString]);

  const handleSave = () => {
    if (!isValid) return;
    
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `Runs on schedule: ${cronString}`,
      data: {
        ...step.data,
        cronString: cronString,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Clock className="text-primary" />
            Edit Trigger: {step.title}
          </DialogTitle>
          <DialogDescription>
            Set a schedule for this workflow to run automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="cron-string">Cron Expression</Label>
                <Input 
                    id="cron-string" 
                    value={cronString} 
                    onChange={e => setCronString(e.target.value)}
                    className={!isValid ? 'border-destructive' : ''}
                />
                <p className={`text-sm ${isValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                    {validationMessage}
                </p>
                <p className="text-xs text-muted-foreground">
                    Learn more about cron syntax <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="underline">here</a>.
                </p>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isValid}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
