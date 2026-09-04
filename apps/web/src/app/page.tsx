import React from 'react';
import { SystemStatus } from '@/components/system-status';
import { ArchitectureOverview } from '@/components/architecture-overview';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Your stack is running.</h1>
        <p className="text-muted-foreground leading-relaxed">
          A Next.js frontend and a Fastify API, with Postgres, Redis, and S3-compatible storage
          behind them. Everything below is live — if a service is down, you&apos;ll see it here.
        </p>
      </section>

      <SystemStatus />
      <ArchitectureOverview />
    </div>
  );
}
