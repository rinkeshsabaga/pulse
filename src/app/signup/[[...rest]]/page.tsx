import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Logo } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your SabagaPulse account',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 gap-6">
      <div className="flex items-center gap-3">
        <Logo className="w-9 h-9 text-primary" />
        <span className="text-2xl font-bold font-headline text-primary">SabagaPulse</span>
      </div>
      <SignUp
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
