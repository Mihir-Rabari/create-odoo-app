'use client';

import React from 'react';
import { useSystemHealth, useSystemInfo } from '@/hooks/use-health';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Server,
  HardDrive,
  Cpu,
  Boxes,
} from 'lucide-react';
import type { ServiceStatus } from '@packages/shared';

function getStatusBadge(status?: ServiceStatus | 'ok' | 'degraded' | 'error' | 'down') {
  switch (status) {
    case 'ok':
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Operational
        </Badge>
      );
    case 'degraded':
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Degraded
        </Badge>
      );
    case 'down':
    case 'error':
      return (
        <Badge variant="error" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Offline
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          Unknown
        </Badge>
      );
  }
}

export function SystemStatus() {
  const { data: health, isLoading, isError, error, refetch, isFetching } = useSystemHealth();
  const { data: systemInfo } = useSystemInfo();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Infrastructure Status Probe
          </CardTitle>
          <CardDescription>
            Live readiness probe polling backend API, PostgreSQL, Redis, and Object Storage
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {health && getStatusBadge(health.status)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Unable to reach Fastify API Gateway
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {error instanceof Error ? error.message : 'Connection refused at http://localhost:3001/health/ready'}
            </p>
            <p className="mt-2 text-xs">
              Make sure the API server is started with <code className="bg-muted px-1.5 py-0.5 rounded font-mono">pnpm dev</code> or <code className="bg-muted px-1.5 py-0.5 rounded font-mono">pnpm dev:api</code> and Docker containers are running with <code className="bg-muted px-1.5 py-0.5 rounded font-mono">pnpm infra:up</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* API Service */}
              <div className="p-4 rounded-lg border bg-card/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-blue-500" /> Fastify API
                  </span>
                  {getStatusBadge(health?.services.api)}
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold font-mono">v{health?.version || '1.0.0'}</div>
                  <div className="text-xs text-muted-foreground">
                    Uptime: {Math.floor(health?.uptime || 0)}s
                  </div>
                </div>
              </div>

              {/* PostgreSQL Database */}
              <div className="p-4 rounded-lg border bg-card/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-500" /> PostgreSQL
                  </span>
                  {getStatusBadge(health?.services.database)}
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold font-mono">
                    {health?.details?.databaseLatencyMs !== undefined
                      ? `${health.details.databaseLatencyMs}ms`
                      : 'Connected'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Drizzle ORM Connection Pool
                  </div>
                </div>
              </div>

              {/* Redis Cache */}
              <div className="p-4 rounded-lg border bg-card/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-rose-500" /> Redis Cache
                  </span>
                  {getStatusBadge(health?.services.redis)}
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold font-mono">
                    {health?.details?.redisLatencyMs !== undefined
                      ? `${health.details.redisLatencyMs}ms`
                      : 'Connected'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    In-memory Key-Value Store
                  </div>
                </div>
              </div>

              {/* MinIO / S3 Object Storage */}
              <div className="p-4 rounded-lg border bg-card/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4 text-amber-500" /> MinIO / S3
                  </span>
                  {getStatusBadge(health?.services.storage || 'ok')}
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold font-mono">
                    {health?.details?.storageLatencyMs !== undefined
                      ? `${health.details.storageLatencyMs}ms`
                      : 'Connected'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    S3 Bucket: app-uploads
                  </div>
                </div>
              </div>
            </div>

            {systemInfo && (
              <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                <span>Node.js Runtime: <code className="font-mono text-foreground">{systemInfo.nodeVersion}</code></span>
                <span>Environment: <code className="font-mono text-foreground">{systemInfo.environment}</code></span>
                <span>Timestamp: <code className="font-mono text-foreground">{new Date(systemInfo.timestamp).toLocaleTimeString()}</code></span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
