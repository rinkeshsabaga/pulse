
// src/components/edit-trigger-dialog.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Copy, Webhook, Loader2, RefreshCw } from 'lucide-react';
import type { WorkflowStepData, WebhookEvent } from '@/lib/types';
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
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/webhooks/${workflowId}/events`);
      if (res.ok) {
        const data = await res.json();
        const fetchedEvents: WebhookEvent[] = data.events ?? [];

        // Merge with any locally generated test events from step data
        const localEvents = (step.data?.events ?? []) as WebhookEvent[];
        const localOnlyEvents = localEvents.filter(
          (le) => !fetchedEvents.some((fe) => fe.id === le.id)
        );

        const merged = [...fetchedEvents, ...localOnlyEvents];
        setEvents(merged);

        // Auto-select the most recent event if nothing selected
        if (!selectedEventId && merged.length > 0) {
          setSelectedEventId(merged[0].id);
        }
      }
    } catch {
      // Silently fail — keep existing events
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, step.data?.events, selectedEventId]);

  useEffect(() => {
    if (open) {
      fetchEvents();
    }
  }, [open, fetchEvents]);

  // Auto-refresh every 5 seconds while dialog is open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [open, fetchEvents]);

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
    const mockEvent: WebhookEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { test: true, timestamp: Date.now(), message: "Hello World" },
      query: {},
      receivedAt: new Date().toISOString()
    };
    
    const newEvents = [mockEvent, ...events];
    setEvents(newEvents);
    setSelectedEventId(mockEvent.id);
    
    toast({
        title: "Test event generated",
        description: "A new test event has been added to the list."
    });
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

                <div className="flex gap-2">
                    <Button onClick={handleGenerateTestEvent} className="flex-1">
                        Generate Test Event
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchEvents} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                
                <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="event-selector">
                      Select an event
                      {isLoading && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
                    </Label>
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
