
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
import { getIntegrationActionGuide, validateIntegrationActionParams } from '@/lib/integration-actions';
import { Textarea } from './ui/textarea';
import { VariableExplorer } from './variable-explorer';
import { getCredentials, type CredentialPublic } from '@/services/credentials';

type EditAppActionDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: Record<string, any>;
};

export function EditAppActionDialog({ step, open, onOpenChange, onSave, dataContext = {} }: EditAppActionDialogProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [credentialId, setCredentialId] = useState('');
  const [credentials, setCredentials] = useState<CredentialPublic[]>([]);
  const [params, setParams] = useState<Record<string, any>>({});
  const [paramsJson, setParamsJson] = useState('{}');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const initialParams = step.data?.appAction?.params || {};
      setSelectedApp(step.data?.appAction?.app || null);
      setSelectedAction(step.data?.appAction?.action || null);
      setCredentialId(step.data?.appAction?.credentialId || '');
      setParams(initialParams);
      setParamsJson(JSON.stringify(initialParams, null, 2));
      setJsonError('');
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

  const actionGuide = useMemo(
    () => selectedApp && selectedAction ? getIntegrationActionGuide(selectedApp, selectedAction) : null,
    [selectedAction, selectedApp]
  );

  const handleSave = () => {
    if (!selectedApp || !selectedAction || !hasSelectedCredential || jsonError) return;

    let finalParams = params;
    try {
      finalParams = JSON.parse(paramsJson);
    } catch {
      setJsonError('Parameters must be valid JSON.');
      return;
    }
    const validationErrors = validateIntegrationActionParams(selectedApp, selectedAction, finalParams);
    if (validationErrors.length > 0) {
      setJsonError(validationErrors.join(' '));
      return;
    }
    
    const actionLabel = appDefinition?.actions.find(a => a.value === selectedAction)?.label || 'App Action';
    
    const updatedStep: WorkflowStepData = {
      ...step,
      title: 'App Action',
      description: actionLabel,
      data: {
        ...step.data,
        appAction: {
          app: selectedApp,
          action: selectedAction,
          credentialId,
          params: finalParams,
        },
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const handleAppSelect = (appName: string) => {
    setSelectedApp(appName);
    setSelectedAction(null); // Reset action when app changes
    setCredentialId('');
    setParams({});
    setParamsJson('{}');
    setJsonError('');
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    const guide = selectedApp ? getIntegrationActionGuide(selectedApp, action) : null;
    const nextParams = guide?.example ?? {};
    setParams(nextParams);
    setParamsJson(JSON.stringify(nextParams, null, 2));
    setJsonError('');
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
                <Label htmlFor="app-credential">Credential</Label>
                <Select value={credentialId} onValueChange={setCredentialId}>
                    <SelectTrigger id="app-credential">
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
                    <p className="text-xs text-destructive">Add a {selectedApp} credential before publishing this workflow.</p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="app-action">Action</Label>
                <Select value={selectedAction || ''} onValueChange={handleActionSelect}>
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
                    <div className="relative">
                        <Textarea 
                            placeholder={'{\n  "channel": "#general",\n  "text": "Hello, {{trigger.body.name}}!"\n}'}
                            rows={6}
                            value={paramsJson}
                            onChange={(e) => {
                                setParamsJson(e.target.value);
                                try {
                                    setParams(JSON.parse(e.target.value));
                                    setJsonError('');
                                } catch {
                                    setJsonError('Parameters must be valid JSON.');
                                }
                            }}
                            className="font-code text-sm"
                        />
                         <div className="absolute top-1 right-1">
                            <VariableExplorer dataContext={dataContext} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Required: {actionGuide?.requiredParams.join(', ') || 'none'}. Use the icon to browse variables from previous steps.
                    </p>
                    {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
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
          <Button type="button" onClick={handleSave} disabled={!selectedApp || !selectedAction || !hasSelectedCredential || Boolean(jsonError)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
