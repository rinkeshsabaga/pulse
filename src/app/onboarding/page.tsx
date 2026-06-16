'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { Loader2, Building2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Page
// Shown after first sign-up to create an organization.
// Creates the Clerk org AND the Prisma Organization record.
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user } = useUser();
  const { createOrganization, setActive } = useClerk();
  const router = useRouter();
  const { toast } = useToast();

  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsLoading(true);
    try {
      // 1. Create org in Clerk
      const org = await createOrganization({ name: orgName.trim() });

      // 2. Set as active org and wait for cookies to flush
      await setActive({ organization: org.id });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Create matching record in our Prisma DB via server action
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkOrgId: org.id,
          name: org.name,
          slug: generateSlug(org.name),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to sync workspace to database.');
      }

      toast({ title: 'Organization created!', description: `Welcome to ${org.name}.` });
      window.location.href = '/home';
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create organization',
        description: err.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9 text-primary" />
            <span className="text-2xl font-bold font-headline text-primary">SabagaPulse</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">One last step to get started</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-headline">Create your workspace</CardTitle>
                <CardDescription>
                  This is where you'll manage your workflows, credentials, and team.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization / Company name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                />
                {orgName && (
                  <p className="text-xs text-muted-foreground">
                    Workspace slug:{' '}
                    <span className="font-mono text-foreground">{generateSlug(orgName)}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Your account</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.fullName ?? 'You'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !orgName.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  'Create workspace & continue →'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
