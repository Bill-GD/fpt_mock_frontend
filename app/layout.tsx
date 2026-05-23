import { Providers } from '@/components/providers';
import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { ReactNode } from 'react';

const appSans = Space_Grotesk({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const appMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SmartQuiz',
  description:
    'Online quiz/exam platform with AI question generation, CSV import, and anti-cheat monitoring.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode; }>) {
  return (
    <html
      lang="en"
      className={`${appSans.variable} ${appMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
