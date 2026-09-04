import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const packages = [
  { name: '@packages/config', desc: 'Constants and typed environment parsing.' },
  { name: '@packages/validation', desc: 'Request and response schemas, pagination, HTTP errors.' },
  { name: '@packages/shared', desc: 'Redis client and S3-compatible storage service.' },
  { name: '@packages/db', desc: 'Drizzle schemas, migrations, and seeds.' },
  { name: '@packages/openapi', desc: 'OpenAPI spec builder and docs metadata.' },
];

const commands = [
  { cmd: 'pnpm dev', desc: 'Run the API and web app' },
  { cmd: 'pnpm infra:up', desc: 'Start Postgres, Redis, and storage' },
  { cmd: 'pnpm db:migrate', desc: 'Apply migrations' },
  { cmd: 'pnpm db:seed', desc: 'Load seed data' },
  { cmd: 'pnpm verify', desc: 'Lint, typecheck, test, build' },
];

export function ArchitectureOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
          <CardDescription>Shared code, importable from either app.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {packages.map((pkg) => (
              <div key={pkg.name} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                <dt className="font-mono text-sm">{pkg.name}</dt>
                <dd className="text-sm text-muted-foreground">{pkg.desc}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commands</CardTitle>
          <CardDescription>Run from the repository root.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {commands.map((c) => (
              <div
                key={c.cmd}
                className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt className="font-mono text-sm">{c.cmd}</dt>
                <dd className="text-right text-sm text-muted-foreground">{c.desc}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
