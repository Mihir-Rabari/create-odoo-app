import React from 'react';
import { SystemStatus } from '@/components/system-status';
import { ArchitectureOverview } from '@/components/architecture-overview';
import { Badge } from '@/components/ui/badge';
import { Server, ShieldCheck, Zap, Database } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="space-y-4 text-center md:text-left pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Production-Ready Full-Stack Architecture</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Next.js + Fastify Enterprise Starter
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-3xl leading-relaxed">
          Engineered with strict package boundaries, type-safe runtime contracts, Fastify OpenAPI documentation, 
          PostgreSQL with Drizzle ORM, Redis caching, S3-compatible storage, and Prometheus/Grafana observability.
        </p>
      </section>

      {/* Live Health & Readiness Status */}
      <section>
        <SystemStatus />
      </section>

      {/* Architecture & Reference */}
      <section>
        <ArchitectureOverview />
      </section>
    </div>
  );
}
