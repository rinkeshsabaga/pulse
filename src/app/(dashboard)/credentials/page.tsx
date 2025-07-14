'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Credential } from '@/lib/types';
import { getCredentials, deleteCredential } from '@/lib/db';
import { CredentialDialog } from '@/components/credential-dialog';

const iconMap: Record<string, React.ElementType> = {
  GitHub: Github,
  default: KeyRound,
};

const iconClassMap: Record<string, string> = {
  GitHub: 'text-neutral-900 dark:text-neutral-100',
};


export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [credentialToEdit, setCredentialToEdit] = useState<Credential | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<Credential | null>(null);
  const { toast } = useToast();

  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      const allCredentials = await getCredentials();
      setCredentials(allCredentials);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading credentials',
        description: 'Could not fetch credentials from the database.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleOpenDialog = (credential?: Credential) => {
    setCredentialToEdit(credential || null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!credentialToDelete) return;

    await deleteCredential(credentialToDelete.id);
    setCredentials(prev => prev.filter((cred) => cred.id !== credentialToDelete.id));

    toast({
      title: 'Credential Deleted',
      description: `"${credentialToDelete.appName}" credential has been successfully deleted.`,
    });
    setCredentialToDelete(null);
  };


  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline">Credentials</h1>
              <p className="text-muted-foreground">Manage your connections to third-party services.</p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Credential
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 w-full">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : credentials.length > 0 ? (
              credentials.map((cred) => {
                const CredIcon = iconMap[cred.appName] || iconMap.default;
                const iconClassName = iconClassMap[cred.appName];
                return (
                  <Card key={cred.id} className="hover:bg-card/95">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 bg-card rounded-lg border", iconClassName)}>
                          <CredIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold">{cred.appName}</p>
                          <p className="text-sm text-muted-foreground">
                            {cred.accountName} ({cred.type.replace('_', ' ')})
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(cred)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCredentialToDelete(cred)}
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
      </div>
      <CredentialDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCredentialSaved={loadCredentials}
        credentialToEdit={credentialToEdit}
      />
      <AlertDialog 
        open={!!credentialToDelete} 
        onOpenChange={(open) => !open && setCredentialToDelete(null)}
      >
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the credential for
                <span className="font-semibold"> {credentialToDelete?.appName} ({credentialToDelete?.accountName})</span>.
                Workflows using this credential will fail.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
