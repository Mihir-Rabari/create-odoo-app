import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Production Starter Monorepo',
  description: 'Production-ready full-stack starter with Next.js, Fastify, PostgreSQL, Redis, and MinIO',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1 container py-8 space-y-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
