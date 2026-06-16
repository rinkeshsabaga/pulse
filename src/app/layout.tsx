import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'reactflow/dist/style.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'SabagaPulse — Workflow Automation',
    template: '%s | SabagaPulse',
  },
  description:
    'SabagaPulse is a powerful workflow automation platform that connects your apps and automates repetitive tasks.',
  keywords: ['workflow automation', 'SaaS', 'no-code', 'integrations', 'zapier alternative'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="h-full">
        <body className={`${inter.variable} h-full font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
