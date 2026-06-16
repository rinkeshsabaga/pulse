import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Logo } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your SabagaPulse account',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 gap-6">
      <div className="flex items-center gap-3">
        <Logo className="w-9 h-9 text-primary" />
        <span className="text-2xl font-bold font-headline text-primary">SabagaPulse</span>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-sm',
            card: 'shadow-lg border border-border rounded-xl',
          },
        }}
      />
    </div>
  );
}
