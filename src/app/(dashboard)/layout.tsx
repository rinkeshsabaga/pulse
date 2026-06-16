'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext } from 'react';
import {
  useOrganization,
  useUser,
  UserButton,
  OrganizationSwitcher,
} from '@clerk/nextjs';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Home,
  Workflow,
  KeyRound,
  CreditCard,
  Settings,
  Activity,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/error-boundary';
import { cn } from '@/lib/utils';

// ─── Plan Context ─────────────────────────────────────────────────────────────

type PlanContextType = {
  plan: string;
};

const PlanContext = createContext<PlanContextType>({ plan: 'FREE' });

export const usePlan = () => useContext(PlanContext);

// ─── Nav Items ────────────────────────────────────────────────────────────────

const navItems = [
  { href: '/home',        label: 'Home',        icon: Home },
  { href: '/workflows',   label: 'Workflows',   icon: Workflow },
  { href: '/runs',        label: 'Runs',        icon: Activity },
  { href: '/credentials', label: 'Credentials', icon: KeyRound },
  { href: '/billing',     label: 'Billing',     icon: CreditCard },
  { href: '/settings',    label: 'Settings',    icon: Settings },
];

const PLAN_COLORS: Record<string, string> = {
  FREE:       'bg-secondary text-secondary-foreground',
  STARTER:    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PRO:        'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();

  // Workflow editor gets a full-screen layout (no sidebar)
  const isWorkflowEditor = /^\/workflows\/[^/]+$/.test(pathname);
  if (isWorkflowEditor) {
    return <main className="h-dvh min-h-0 overflow-hidden">{children}</main>;
  }

  // Read the plan from org public metadata (set via Clerk dashboard or webhooks)
  const plan = (organization?.publicMetadata?.plan as string) ?? 'FREE';

  return (
    <PlanContext.Provider value={{ plan }}>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-muted/40">
          {/* ── Sidebar ── */}
          <Sidebar>
            {/* Logo + Org Switcher */}
            <SidebarHeader className="gap-3">
              <Link href="/home" className="flex items-center gap-2 px-1">
                <Logo className="w-7 h-7 text-primary shrink-0" />
                <span className="text-lg font-semibold font-headline text-primary truncate">
                  SabagaPulse
                </span>
              </Link>

              {/* Clerk org switcher — lets users switch between orgs */}
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/onboarding"
                afterSelectOrganizationUrl="/home"
                afterLeaveOrganizationUrl="/onboarding"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    organizationSwitcherTrigger:
                      'w-full justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-accent',
                  },
                }}
              />
            </SidebarHeader>

            {/* Nav */}
            <SidebarContent>
              <SidebarMenu>
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    href === '/home'
                      ? pathname === '/home'
                      : pathname.startsWith(href);

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={href} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                          {isActive && (
                            <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>

            {/* Footer — User info + controls */}
            <SidebarFooter>
              <div className="flex flex-col gap-2 p-2">
                {/* Plan badge */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>Current plan</span>
                  </div>
                  <Badge
                    className={cn('text-xs font-semibold', PLAN_COLORS[plan] ?? PLAN_COLORS.FREE)}
                    variant="outline"
                  >
                    {plan}
                  </Badge>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mx-1" />

                {/* User row */}
                <div className="flex items-center gap-3 px-1 py-1">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'h-8 w-8',
                      },
                    }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? 'You'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </span>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* ── Main Content ── */}
          <main className="flex-1 h-full overflow-y-auto">
            <div className="p-4 sm:p-6">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </PlanContext.Provider>
  );
}
