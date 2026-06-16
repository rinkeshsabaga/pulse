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
import { Input } from '@/components/ui/input';
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
import { getCredentials, type CredentialPublic } from '@/services/credentials';

type EditAppTriggerDialogProps = {
  step: WorkflowStepData;
  workflowId: string;
  webhookSecret?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

const WOOCOMMERCE_WEBHOOK_TOPICS: Record<string, { topic: string; actionEvent?: string }> = {
  order_created: { topic: 'Order created' },
  order_updated: { topic: 'Order updated' },
  product_low_stock: { topic: 'Action', actionEvent: 'woocommerce_low_stock' },
};

export function EditAppTriggerDialog({
  step,
  workflowId,
  webhookSecret,
  open,
  onOpenChange,
  onSave,
}: EditAppTriggerDialogProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [credentialId, setCredentialId] = useState('');
  const [credentials, setCredentials] = useState<CredentialPublic[]>([]);
  const [storeUrl, setStoreUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    setBaseUrl(appUrl.replace(/\/$/, ''));
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedApp(step.data?.appTrigger?.app || null);
      setSelectedEvent(step.data?.appTrigger?.event || null);
      setCredentialId(step.data?.appTrigger?.credentialId || '');
      setStoreUrl(step.data?.appTrigger?.storeUrl || '');
      getCredentials()
        .then((items) => setCredentials(items.filter((item) => ['OAUTH', 'API_KEY', 'BASIC_AUTH'].includes(item.type))))
        .catch(() => setCredentials([]));
    }
  }, [open, step.data]);

  const appDefinition = useMemo(() => {
    return APP_DEFINITIONS.find(app => app.name === selectedApp);
  }, [selectedApp]);

  const matchingCredentials = useMemo(
    () => credentials.filter((credential) => credential.appName === selectedApp),
    [credentials, selectedApp]
  );
  const hasSelectedCredential = matchingCredentials.some((credential) => credential.id === credentialId);

  const selectedEventLabel = useMemo(() => {
    return appDefinition?.triggers.find(t => t.value === selectedEvent)?.label || 'App Event';
  }, [appDefinition, selectedEvent]);

  const webhookUrl = useMemo(() => {
    if (!baseUrl || !selectedApp || !selectedEvent) return '';
    const url = new URL(`/api/webhooks/${workflowId}`, baseUrl);
    url.searchParams.set('app', selectedApp);
    url.searchParams.set('event', selectedEvent);
    return url.toString();
  }, [baseUrl, selectedApp, selectedEvent, workflowId]);

  const isWooCommerceTrigger = selectedApp === 'WooCommerce';

  const handleSave = () => {
    if (!selectedApp || !selectedEvent || !hasSelectedCredential) return;

    const updatedStep: WorkflowStepData = {
      ...step,
      title: 'App Event',
      description: `${appDefinition?.name || selectedApp}: ${selectedEventLabel}`,
      data: {
        ...step.data,
        appTrigger: {
          app: selectedApp,
          event: selectedEvent,
          credentialId,
          ...(storeUrl.trim() ? { storeUrl: storeUrl.trim().replace(/\/$/, '') } : {}),
        },
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const handleAppSelect = (appName: string) => {
    setSelectedApp(appName);
    setSelectedEvent(null);
    setCredentialId('');
    setStoreUrl('');
  };

  const renderAppSelection = () => (
    <>
      <DialogDescription>
        Choose an application to trigger this workflow.
      </DialogDescription>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
        {APP_DEFINITIONS.map((app) => (
          <Card
            key={app.name}
            className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent hover:border-primary transition-colors"
            onClick={() => handleAppSelect(app.name)}
          >
            <app.icon className={cn('h-8 w-8', app.iconClassName)} />
            <span className="font-semibold text-sm">{app.name}</span>
          </Card>
        ))}
      </div>
    </>
  );

  const renderWooCommerceSetup = () => {
    if (!selectedEvent) return null;

    const webhookTopic = WOOCOMMERCE_WEBHOOK_TOPICS[selectedEvent];

    return (
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div>
          <p className="font-medium">WooCommerce webhook setup</p>
          <p className="text-xs text-muted-foreground">
            In WooCommerce, go to Settings &gt; Advanced &gt; Webhooks, then add an active webhook with these values.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input readOnly value={`SabagaPulse - ${selectedEventLabel}`} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input readOnly value="Active" />
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input readOnly value={webhookTopic?.topic || selectedEventLabel} />
          </div>
          {webhookTopic?.actionEvent && (
            <div className="space-y-2">
              <Label>Action Event</Label>
              <Input readOnly value={webhookTopic.actionEvent} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Delivery URL</Label>
          <Input readOnly value={webhookUrl} placeholder="Select an event to generate the URL" className="font-code text-xs" />
        </div>

        <div className="space-y-2">
          <Label>Secret</Label>
          <Input
            readOnly
            value={webhookSecret || 'Save the workflow first to generate a webhook secret'}
            className="font-code text-xs"
          />
          <p className="text-xs text-muted-foreground">
            WooCommerce signs deliveries with this secret. SabagaPulse verifies the incoming X-WC-Webhook-Signature header before running the workflow.
          </p>
        </div>
      </div>
    );
  };

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
            <AppIcon className={cn('h-8 w-8', appDefinition.iconClassName)} />
            <div>
              <DialogTitle className="text-lg">Configure Trigger for {appDefinition.name}</DialogTitle>
              <DialogDescription>Select the connection and event that will start the workflow.</DialogDescription>
            </div>
          </div>
        </div>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-trigger-credential">Connection</Label>
            <Select value={credentialId} onValueChange={setCredentialId}>
              <SelectTrigger id="app-trigger-credential">
                <SelectValue placeholder="Select a connected account" />
              </SelectTrigger>
              <SelectContent>
                {matchingCredentials.map((credential) => (
                  <SelectItem key={credential.id} value={credential.id}>
                    {credential.accountName} ({credential.type.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {matchingCredentials.length === 0 && (
              <p className="text-xs text-destructive">
                Add a {selectedApp} credential on the <a href="/credentials" className="underline">Credentials</a> page before publishing this workflow.
              </p>
            )}
          </div>

          <div className="space-y-2">
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

          {isWooCommerceTrigger && (
            <div className="space-y-2">
              <Label htmlFor="woocommerce-store-url">WooCommerce Store URL</Label>
              <Input
                id="woocommerce-store-url"
                value={storeUrl}
                onChange={(event) => setStoreUrl(event.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                Saved with the trigger so this connection can be upgraded to automatic webhook registration later.
              </p>
            </div>
          )}

          {isWooCommerceTrigger && renderWooCommerceSetup()}
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2 font-headline', selectedApp && 'hidden')}>
            <AppWindow className="text-primary" />
            Configure App Trigger
          </DialogTitle>
        </DialogHeader>

        {selectedApp ? renderEventSelection() : renderAppSelection()}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedApp || !selectedEvent || !hasSelectedCredential}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
