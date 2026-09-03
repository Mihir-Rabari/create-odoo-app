import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Terminal } from 'lucide-react';

export function ArchitectureOverview() {
  const packages = [
    {
      name: '@packages/config',
      path: 'packages/config',
      desc: 'Application configuration constants & typed Zod runtime environment parsing.',
      tags: ['Zod', 'dotenv'] },
    {
      name: '@packages/validation',
      path: 'packages/validation',
      desc: 'Reusable request/response validation schemas, pagination, and standardized HTTP error structures.',
      tags: ['Zod', 'HTTP Errors'] },
    {
      name: '@packages/shared',
      path: 'packages/shared',
      desc: 'Redis client abstraction (ioredis) & S3-compatible storage service (@aws-sdk/client-s3).',
      tags: ['Redis', 'S3 / MinIO'] },
    {
      name: '@packages/db',
      path: 'packages/db',
      desc: 'PostgreSQL connection pooling, Drizzle ORM schemas, migration runner, and deterministic seeds.',
      tags: ['Drizzle ORM', 'PostgreSQL'] },
    {
      name: '@packages/openapi',
      path: 'packages/openapi',
      desc: 'OpenAPI 3.0 specification builder, tag taxonomy, and documentation metadata generators.',
      tags: ['OpenAPI 3.0', 'Swagger'] },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monorepo Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Monorepo Package Registry
          </CardTitle>
          <CardDescription>
            Reusable internal packages decoupled from application layers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.name} className="p-3 rounded-lg border bg-muted/30 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-foreground">{pkg.name}</span>
                <div className="flex gap-1">
                  {pkg.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{pkg.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Developer Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Standard Developer Commands
          </CardTitle>
          <CardDescription>
            All development tasks run via pnpm workspace filters from root
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-muted/60 border">
            <div className="text-muted-foreground text-[11px] font-sans mb-1">Start Full Development Stack</div>
            <code className="text-foreground font-bold">pnpm dev</code>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/60 border">
            <div className="text-muted-foreground text-[11px] font-sans mb-1">Launch Docker Infrastructure</div>
            <code className="text-foreground font-bold">pnpm infra:up</code>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/60 border">
            <div className="text-muted-foreground text-[11px] font-sans mb-1">Run PostgreSQL Database Migrations</div>
            <code className="text-foreground font-bold">pnpm db:migrate</code>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/60 border">
            <div className="text-muted-foreground text-[11px] font-sans mb-1">Run Deterministic Seeds</div>
            <code className="text-foreground font-bold">pnpm db:seed</code>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/60 border">
            <div className="text-muted-foreground text-[11px] font-sans mb-1">Verify Full System Health</div>
            <code className="text-foreground font-bold">pnpm health</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
