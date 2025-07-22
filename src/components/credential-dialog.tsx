
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addCredential, updateCredential } from '@/lib/db';
import type { Credential } from '@/lib/types';
import { KeyRound, Loader2 } from 'lucide-react';

const formSchema = z.object({
  appName: z.string().min(2, { message: 'App name must be at least 2 characters.' }),
  accountName: z.string().min(2, { message: 'Account name must be at least 2 characters.' }),
  type: z.enum(['API_KEY', 'OAuth']),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
}).refine(data => {
  if (data.type === 'API_KEY') {
    return !!data.apiKey;
  }
  return true;
}, {
  message: 'API Key is required for API_KEY type.',
  path: ['apiKey'],
});

type CredentialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialSaved: () => void;
  credentialToEdit?: Credential | null;
};

export function CredentialDialog({ open, onOpenChange, onCredentialSaved, credentialToEdit }: CredentialDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: '',
      accountName: '',
      type: 'API_KEY',
      apiKey: '',
      apiSecret: '',
    },
  });

  const credentialType = form.watch('type');

  useEffect(() => {
    if (credentialToEdit) {
      form.reset({
        appName: credentialToEdit.appName,
        accountName: credentialToEdit.accountName,
        type: credentialToEdit.type,
        apiKey: credentialToEdit.authData.apiKey,
        apiSecret: credentialToEdit.authData.apiSecret,
      });
    } else {
      form.reset({
        appName: '',
        accountName: '',
        type: 'API_KEY',
        apiKey: '',
        apiSecret: '',
      });
    }
  }, [credentialToEdit, open, form]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isSaving) {
      onOpenChange(isOpen);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      const authData = {
        apiKey: values.apiKey,
        apiSecret: values.apiSecret,
      };

      if (credentialToEdit) {
        // In a real app, you'd get the org ID from the user's session
        await updateCredential(credentialToEdit.id, { ...values, type: values.type as 'API_KEY' | 'OAuth', authData });
        toast({
          title: 'Credential Updated',
          description: `Successfully updated "${values.appName}".`,
        });
      } else {
        // In a real app, you'd get the org ID from the user's session
        await addCredential({ ...values, type: values.type as 'API_KEY' | 'OAuth', authData });
        toast({
          title: 'Credential Added',
          description: `Successfully added "${values.appName}".`,
        });
      }
      onCredentialSaved();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save the credential. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
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
            Securely store your API keys and other secrets. This data is not encrypted in this prototype.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'GitHub'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name / Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'my-work-account'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="OAuth" disabled>OAuth 2.0 (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {credentialType === 'API_KEY' && (
              <>
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******************" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="apiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret (Optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******************" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {credentialType === 'OAuth' && (
                <div className="p-4 text-center text-sm text-muted-foreground bg-muted rounded-md">
                    <p>OAuth 2.0 connection flow is not yet implemented.</p>
                    <p>Please use the API Key method for now.</p>
                </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || credentialType === 'OAuth'}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {credentialToEdit ? 'Save Changes' : 'Add Credential'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
