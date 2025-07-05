'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, Plus, Trash2, Edit, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AsanaIcon, HubSpotIcon, SalesforceIcon } from '@/components/icons';
import { Github } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for credentials
const credentials = [
  {
    id: 'cred_1',
    appName: 'GitHub',
    type: 'OAuth',
    accountName: 'my-github-user',
    icon: Github,
    iconClassName: 'text-neutral-900 dark:text-neutral-100',
  },
  {
    id: 'cred_2',
    appName: 'Salesforce',
    type: 'OAuth',
    accountName: 'my-sales-org',
    icon: SalesforceIcon,
  },
];

export default function CredentialsPage() {
  const { toast } = useToast();

  const showNotImplementedToast = (feature: string) => {
    toast({
      title: 'Coming Soon!',
      description: `${feature} functionality is not yet implemented.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Credentials</h1>
          <p className="text-muted-foreground">Manage your connections to third-party services.</p>
        </div>
        <Button onClick={() => showNotImplementedToast('Add Credential')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Credential
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {credentials.length > 0 ? (
          credentials.map((cred) => {
            const CredIcon = cred.icon;
            return (
              <Card key={cred.id} className="hover:bg-card/95">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 bg-card rounded-lg border", cred.iconClassName)}>
                      <CredIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{cred.appName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cred.accountName} ({cred.type})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => showNotImplementedToast('Edit Credential')}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => showNotImplementedToast('Delete Credential')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="w-full border-dashed bg-transparent hover:border-primary/50 transition-colors">
            <CardContent className="p-10 text-center flex flex-col items-center">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <p className="text-foreground font-semibold">
                No credentials found
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Add a new credential to connect your apps and services.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
