import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Production Starter',
  description: 'Full-stack starter: Next.js, Fastify, PostgreSQL, Redis, and S3-compatible storage.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <Providers>
          <Navbar />
          {/* The only container in the tree. Pages lay out inside it. */}
          <main className="flex-1 container py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
