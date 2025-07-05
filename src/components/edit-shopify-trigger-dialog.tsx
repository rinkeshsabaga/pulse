
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart } from 'lucide-react';
import type { WorkflowStepData, ShopifyEvent, ShopifySubEvent } from '@/lib/types';

type EditShopifyTriggerDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

const eventOptions: { value: ShopifyEvent; label: string }[] = [
  { value: 'abandoned_checkout', label: 'Abandoned Checkout' },
  { value: 'order_placed', label: 'New Order Placed' },
  { value: 'order_fulfilled', label: 'Order Fulfilled' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'refund_initiated', label: 'Refund Initiated' },
  { value: 'order_shipment', label: 'Order Shipment Event' },
  { value: 'order_updated', label: 'Order Updated' },
];

const subEventOptions: Record<string, { value: ShopifySubEvent; label: string }[]> = {
  order_shipment: [
    { value: 'shipment_in_transit', label: 'In Transit' },
    { value: 'shipment_out_for_delivery', label: 'Out for Delivery' },
    { value: 'shipment_delivered', label: 'Delivered' },
  ],
  order_updated: [
    { value: 'update_tags_added', label: 'Tags Added' },
    { value: 'update_tags_removed', label: 'Tags Removed' },
    { value: 'update_line_items_changed', label: 'Line Items Changed' },
  ],
};


export function EditShopifyTriggerDialog({ step, open, onOpenChange, onSave }: EditShopifyTriggerDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState<ShopifyEvent | undefined>(step.data?.shopifyEvent);
  const [selectedSubEvent, setSelectedSubEvent] = useState<ShopifySubEvent | undefined>(step.data?.shopifySubEvent);

  useEffect(() => {
    if (open) {
      setSelectedEvent(step.data?.shopifyEvent);
      setSelectedSubEvent(step.data?.shopifySubEvent);
    }
  }, [open, step.data]);

  const handleEventChange = (value: ShopifyEvent) => {
    setSelectedEvent(value);
    // Reset sub-event if the main event doesn't have any
    if (!subEventOptions[value]) {
        setSelectedSubEvent(undefined);
    } else {
        // Set a default sub-event if one exists
        setSelectedSubEvent(subEventOptions[value][0].value);
    }
  }

  const handleSave = () => {
    const eventLabel = eventOptions.find(e => e.value === selectedEvent)?.label || 'Shopify Event';
    const subEventLabel = selectedEvent && selectedSubEvent ? subEventOptions[selectedEvent]?.find(e => e.value === selectedSubEvent)?.label : '';

    const newDescription = subEventLabel ? `${eventLabel}: ${subEventLabel}` : eventLabel;
    
    const updatedStep: WorkflowStepData = {
      ...step,
      description: newDescription,
      data: {
        ...step.data,
        shopifyEvent: selectedEvent,
        shopifySubEvent: selectedEvent && subEventOptions[selectedEvent] ? selectedSubEvent : undefined,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const currentSubEvents = selectedEvent ? subEventOptions[selectedEvent] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <ShoppingCart className="text-primary" />
            Edit Trigger: {step.title}
          </DialogTitle>
          <DialogDescription>
            Choose the specific Shopify event that will trigger this workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="shopify-event">Shopify Event</Label>
                <Select value={selectedEvent} onValueChange={(v) => handleEventChange(v as ShopifyEvent)}>
                    <SelectTrigger id="shopify-event">
                        <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                        {eventOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {currentSubEvents && (
                 <div className="space-y-2">
                    <Label htmlFor="shopify-sub-event">Specific Event</Label>
                    <Select value={selectedSubEvent} onValueChange={(v) => setSelectedSubEvent(v as ShopifySubEvent)}>
                        <SelectTrigger id="shopify-sub-event">
                            <SelectValue placeholder="Select a specific event" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentSubEvents.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
