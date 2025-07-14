
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Home,
  Workflow,
  KeyRound,
  CreditCard,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { DashboardLayout as EditorLayout } from '@/components/dashboard-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathParts = pathname.split('/').filter(Boolean);
  const isEditorPage = pathParts[0] === 'workflows' && pathParts.length > 1;
  const { setTheme } = useTheme();


  if (isEditorPage) {
    // The editor has its own complex layout, so we render it directly.
    // We pass `children` which will be the page component rendered by Next.js.
    return <EditorLayout>{children}</EditorLayout>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-primary" />
              <span className="text-lg font-semibold font-headline text-primary">
                SabagaPulse
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/home'}
                  className="justify-start"
                >
                  <Link href="/home">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/workflows')}
                  className="justify-start"
                >
                  <Link href="/workflows">
                    <Workflow className="mr-2 h-4 w-4" />
                    Workflows
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className="justify-start"
                  isActive={pathname.startsWith('/credentials')}
                >
                  <Link href="/credentials">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Credentials
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className="justify-start"
                  isActive={pathname.startsWith('/billing')}
                >
                  <Link href="/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className="justify-start"
                  isActive={pathname.startsWith('/settings')}
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="profile picture" />
                    <AvatarFallback>N</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Sabaga User</p>
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" side="top">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/login')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center h-14 px-4 border-b bg-background sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <Link href="/home" className="hover:text-foreground">Home</Link>
                {pathParts.filter(p => p !== 'home').map((part, index) => (
                  <React.Fragment key={part}>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link
                      href={`/${pathParts.slice(0, index + 1).join('/')}`}
                      className={cn(
                        "capitalize",
                        index === pathParts.length - 1 ? "text-foreground" : "hover:text-foreground"
                      )}
                    >
                      {part.replace('-', ' ')}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="profile avatar" />
                      <AvatarFallback>R</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/login')}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 flex flex-col p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
