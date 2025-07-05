// src/components/edit-trigger-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import type { WorkflowStepData } from './dashboard-layout';

type EditTriggerDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditTriggerDialog({ step, open, onOpenChange }: EditTriggerDialogProps) {
  const { toast } = useToast();
  const Icon = step.icon;

  const handleCopy = () => {
    if (step.data?.webhookUrl) {
      navigator.clipboard.writeText(step.data.webhookUrl);
      toast({
        title: 'Copied to clipboard!',
        description: 'The webhook URL has been copied.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Icon className="text-primary" />
            Edit Trigger: {step.title}
          </DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {step.data?.webhookUrl ? (
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex items-center space-x-2">
                <Input id="webhook-url" value={step.data.webhookUrl} readOnly />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send a POST request to this URL to trigger the workflow.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This trigger does not have any editable properties.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
