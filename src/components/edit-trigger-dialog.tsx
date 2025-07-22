
// src/components/edit-trigger-dialog.tsx
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
import { useToast } from '@/hooks/use-toast';
import { Copy, Webhook, Loader2 } from 'lucide-react';
import type { WorkflowStepData, WebhookEvent } from '@/lib/types';
import { addTestWebhookEvent } from '@/lib/db';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { JsonTreeView } from './json-tree-view';
import { Badge } from './ui/badge';

type EditTriggerDialogProps = {
  step: WorkflowStepData;
  workflowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

export function EditTriggerDialog({ step, workflowId, open, onOpenChange, onSave }: EditTriggerDialogProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      const initialEvents = step.data?.events || [];
      setEvents(initialEvents);
      
      const initialSelectedId = step.data?.selectedEventId || (initialEvents.length > 0 ? initialEvents[0].id : null);
      setSelectedEventId(initialSelectedId);
    }
  }, [open, step.data]);

  const handleCopy = () => {
    if (step.data?.webhookUrl) {
      navigator.clipboard.writeText(step.data.webhookUrl);
      toast({
        title: 'Copied to clipboard!',
        description: 'The webhook URL has been copied.',
      });
    }
  };
  
  const handleGenerateTestEvent = async () => {
    setIsGenerating(true);
    try {
      // In a real app, you'd get the org ID from the user's session
      const updatedWorkflow = await addTestWebhookEvent(workflowId, step.id);
      if (updatedWorkflow) {
        const updatedStep = updatedWorkflow.steps.find(s => s.id === step.id);
        const newEvents = updatedStep?.data?.events || [];
        setEvents(newEvents);
        if (newEvents.length > 0 && !selectedEventId) {
            setSelectedEventId(newEvents[0].id);
        } else if (newEvents.length > 0) {
            setSelectedEventId(newEvents[0].id);
        }
        toast({
            title: "Test event generated",
            description: "A new test event has been added to the list."
        });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate test event.'});
    } finally {
        setIsGenerating(false);
    }
  }

  const handleSave = () => {
    const updatedStep = {
        ...step,
        data: {
            ...step.data,
            selectedEventId: selectedEventId,
            events: events,
        }
    };
    onSave(updatedStep);
    onOpenChange(false);
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Webhook className="text-primary" />
            Edit Trigger: {step.title}
          </DialogTitle>
          <DialogDescription>
            This unique URL triggers the workflow. Send a POST request to it. Recent events will appear below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
            <div className="space-y-6 flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input id="webhook-url" value={step.data?.webhookUrl || ''} readOnly />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                    <Button onClick={handleGenerateTestEvent} disabled={isGenerating} className="w-full">
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Generate Test Event
                    </Button>
                </div>
                
                <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="event-selector">Select an event</Label>
                    <Select value={selectedEventId || ''} onValueChange={setSelectedEventId}>
                        <SelectTrigger id="event-selector">
                           <SelectValue placeholder="No events received yet..." />
                        </SelectTrigger>
                        <SelectContent>
                           {events.length === 0 && <SelectItem value="none" disabled>Listening for events...</SelectItem>}
                           {events.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                                <div className="flex items-center justify-between w-full">
                                    <span>
                                        <Badge variant="outline" className="mr-2">{event.method}</Badge> 
                                        {new Date(event.receivedAt).toLocaleTimeString()}
                                    </span>
                                    <span className="text-muted-foreground text-xs ml-4">
                                       {formatDistanceToNow(new Date(event.receivedAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="space-y-2 flex flex-col min-h-0">
                <Label>Event Payload</Label>
                <ScrollArea className="border rounded-md flex-1 bg-muted/30">
                   <div className="p-4">
                     {selectedEvent ? (
                        <JsonTreeView data={selectedEvent} />
                     ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-10">
                            <p>Select an event or generate a test event to see its payload.</p>
                        </div>
                     )}
                   </div>
                </ScrollArea>
            </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedEventId}>
            Save and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
