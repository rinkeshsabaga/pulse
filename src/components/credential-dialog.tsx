'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Nango from '@nangohq/frontend';
import { KeyRound, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createCredential, updateCredential, type CredentialPublic } from '@/services/credentials';
import { NANGO_INTEGRATIONS } from '@/lib/nango-config';

const formSchema = z.object({
  appName: z.string().min(2, { message: 'Application name must be at least 2 characters.' }),
  accountName: z.string().min(2, { message: 'Account name must be at least 2 characters.' }),
  type: z.enum(['API_KEY', 'OAUTH', 'DATABASE_URL', 'BASIC_AUTH']),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  connectionString: z.string().optional(),
});

type CredentialFormValues = z.infer<typeof formSchema>;

type CredentialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialSaved: () => void;
  credentialToEdit?: CredentialPublic | null;
};

const emptyValues: CredentialFormValues = {
  appName: '', accountName: '', type: 'API_KEY', apiKey: '', apiSecret: '',
  username: '', password: '', connectionString: '',
};

export function CredentialDialog({ open, onOpenChange, onCredentialSaved, credentialToEdit }: CredentialDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  });
  const credentialType = form.watch('type');
  const selectedAppName = form.watch('appName');
  const supportedApps = Object.keys(NANGO_INTEGRATIONS);
  const appOptions = selectedAppName && !supportedApps.includes(selectedAppName)
    ? [selectedAppName, ...supportedApps]
    : supportedApps;

  useEffect(() => {
    form.reset(credentialToEdit ? {
      ...emptyValues,
      appName: credentialToEdit.appName,
      accountName: credentialToEdit.accountName,
      type: credentialToEdit.type,
    } : emptyValues);
  }, [credentialToEdit, form, open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isSaving) onOpenChange(isOpen);
  };

  async function onSubmit(values: CredentialFormValues) {
    if (!validateRequiredSecrets(values, Boolean(credentialToEdit), form.setError)) return;

    setIsSaving(true);
    try {
      if (values.type === 'OAUTH') {
        await saveOAuthCredential(values);
      } else {
        const authData = getAuthData(values);
        if (credentialToEdit) {
          await updateCredential(credentialToEdit.id, {
            appName: values.appName,
            accountName: values.accountName,
            ...(Object.keys(authData).length > 0 ? { authData } : {}),
          });
        } else {
          await createCredential({
            appName: values.appName,
            accountName: values.accountName,
            type: values.type,
            authData,
          });
        }
        toast({
          title: credentialToEdit ? 'Credential Updated' : 'Credential Added',
          description: `Successfully saved "${values.appName}".`,
        });
      }

      onCredentialSaved();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Credential Error',
        description: error instanceof Error ? error.message : 'Failed to save the credential.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function saveOAuthCredential(values: CredentialFormValues) {
    const providerKey = NANGO_INTEGRATIONS[values.appName];
    if (!providerKey) throw new Error(`OAuth is not configured for ${values.appName}.`);

    const publicKey = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY;
    if (!publicKey) throw new Error('NEXT_PUBLIC_NANGO_PUBLIC_KEY is not configured.');

    const nango = new Nango({ publicKey });
    const connectionId = credentialToEdit?.nangoConnectionId ?? `pulse-${crypto.randomUUID()}`;
    await nango.auth(providerKey, connectionId);

    if (credentialToEdit) {
      await updateCredential(credentialToEdit.id, {
        accountName: values.accountName,
        nangoConnectionId: connectionId,
      });
    } else {
      await createCredential({
        appName: values.appName,
        accountName: values.accountName,
        type: 'OAUTH',
        authData: {},
        nangoConnectionId: connectionId,
      });
    }

    toast({
      title: credentialToEdit ? 'OAuth Reconnected' : 'OAuth Connected',
      description: `${values.appName} is connected and ready for workflows.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <KeyRound className="text-primary" />
            {credentialToEdit ? 'Edit Credential' : 'Add New Credential'}
          </DialogTitle>
          <DialogDescription>
            Secrets are encrypted before storage and are only decrypted during server-side execution.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Authentication Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(credentialToEdit)}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="API_KEY">API Key</SelectItem>
                    <SelectItem value="OAUTH">OAuth 2.0</SelectItem>
                    <SelectItem value="DATABASE_URL">PostgreSQL URL</SelectItem>
                    <SelectItem value="BASIC_AUTH">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="appName" render={({ field }) => (
              <FormItem>
                <FormLabel>{credentialType === 'DATABASE_URL' ? 'Database Name' : 'Application Name'}</FormLabel>
                {credentialType !== 'DATABASE_URL' ? (
                  <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(credentialToEdit)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an application" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {appOptions.map((appName) => (
                        <SelectItem key={appName} value={appName}>{appName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder={credentialType === 'DATABASE_URL' ? 'Production PostgreSQL' : 'GitHub'} {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="accountName" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name / Identifier</FormLabel>
                <FormControl><Input placeholder="my-work-account" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {credentialType === 'API_KEY' && <>
              <SecretField form={form} name="apiKey" label="API Key" editing={Boolean(credentialToEdit)} />
              <SecretField form={form} name="apiSecret" label="API Secret / Token (Optional)" editing={Boolean(credentialToEdit)} />
            </>}

            {credentialType === 'BASIC_AUTH' && <>
              <SecretField form={form} name="username" label="Username" editing={Boolean(credentialToEdit)} text />
              <SecretField form={form} name="password" label="Password" editing={Boolean(credentialToEdit)} />
            </>}

            {credentialType === 'DATABASE_URL' && (
              <SecretField form={form} name="connectionString" label="PostgreSQL Connection URL" editing={Boolean(credentialToEdit)} />
            )}

            {credentialType === 'OAUTH' && (
              <div className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
                <p>{credentialToEdit ? 'Reconnect' : 'Connect'} with {form.watch('appName') || 'the selected service'} using Nango.</p>
                <p className="mt-2 text-xs">The provider login opens in a secure authorization window.</p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {credentialType === 'OAUTH'
                  ? (credentialToEdit ? 'Reconnect & Save' : 'Connect with OAuth')
                  : (credentialToEdit ? 'Save Changes' : 'Add Credential')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type SecretFieldName = 'apiKey' | 'apiSecret' | 'username' | 'password' | 'connectionString';

function SecretField({ form, name, label, editing, text = false }: {
  form: ReturnType<typeof useForm<CredentialFormValues>>;
  name: SecretFieldName;
  label: string;
  editing: boolean;
  text?: boolean;
}) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            type={text ? 'text' : 'password'}
            placeholder={editing ? 'Leave blank to keep the current value' : label}
            {...field}
            value={field.value ?? ''}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function getAuthData(values: CredentialFormValues) {
  const entries: Array<[string, string | undefined]> = values.type === 'API_KEY'
    ? [['apiKey', values.apiKey], ['apiSecret', values.apiSecret]]
    : values.type === 'BASIC_AUTH'
      ? [['username', values.username], ['password', values.password]]
      : [['connectionString', values.connectionString]];

  return Object.fromEntries(entries.filter(([, value]) => Boolean(value?.trim())));
}

function validateRequiredSecrets(
  values: CredentialFormValues,
  editing: boolean,
  setError: ReturnType<typeof useForm<CredentialFormValues>>['setError']
): boolean {
  if (editing || values.type === 'OAUTH') return true;
  if (values.type === 'API_KEY' && !values.apiKey?.trim()) {
    setError('apiKey', { message: 'API key is required.' });
    return false;
  }
  if (values.type === 'DATABASE_URL' && !values.connectionString?.trim()) {
    setError('connectionString', { message: 'Connection URL is required.' });
    return false;
  }
  if (values.type === 'BASIC_AUTH' && (!values.username?.trim() || !values.password?.trim())) {
    if (!values.username?.trim()) setError('username', { message: 'Username is required.' });
    if (!values.password?.trim()) setError('password', { message: 'Password is required.' });
    return false;
  }
  return true;
}
