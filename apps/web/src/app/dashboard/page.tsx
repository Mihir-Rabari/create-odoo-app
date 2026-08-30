'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ShieldCheck,
  Key,
  Clock,
  CheckCircle2,
  LogIn,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, session, effectivePermissions, isAuthenticated, isLoading, isRoot, hasPermission } =
    useAuth();

  if (isLoading) {
    return (
      <div className="container py-12 max-w-5xl space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-muted animate-pulse rounded-lg" />
          <div className="h-40 bg-muted animate-pulse rounded-lg" />
          <div className="h-40 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-20 max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Key className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Authentication Required</h1>
        <p className="text-sm text-muted-foreground">
          You must be signed in to view your user dashboard and effective IAM permissions.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canAccessAdmin = isRoot || hasPermission('admin:access');

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>Welcome, {user.name}</span>
            {isRoot && (
              <Badge variant="destructive" className="text-xs uppercase">
                👑 ROOT AUTHORITY
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Active identity session: <code className="font-mono text-xs text-foreground">{user.email}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
          {canAccessAdmin && (
            <Link href="/admin">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <ShieldCheck className="mr-2 h-4 w-4" />
                IAM Admin Console
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Identity Status
            </CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="capitalize">{user.status.toLowerCase()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              Type: <strong className="text-foreground">{user.identityType}</strong>
            </div>
            <div>
              User ID: <code className="font-mono text-[10px]">{user.id}</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Session Lifetime
            </CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              Expires: {session ? new Date(session.expiresAt).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              Security: <strong className="text-foreground">HTTP-Only Cookie</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              IAM Authority
            </CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <span>{isRoot ? 'Unrestricted' : `${effectivePermissions.length} Actions`}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              Precedence: <strong className="text-foreground">Explicit Deny Override</strong>
            </div>
            <div>
              Scope: {isRoot ? 'Global Superuser' : 'External Policy'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Effective Permissions Viewer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <span>Effective IAM Permissions</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Resolved actions evaluated across direct user policies, group memberships, and role assignments
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {isRoot ? 'ROOT BROWSER' : `${effectivePermissions.length} Allowed`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isRoot ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Root Authority Mode
              </div>
              <p className="text-muted-foreground">
                This identity is the root system bootstrap account. It bypasses standard policy statement evaluation and is automatically authorized for all registered actions across all namespaces.
              </p>
            </div>
          ) : effectivePermissions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No effective permissions granted to this account.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {effectivePermissions.map((action) => (
                <Badge
                  key={action}
                  variant="secondary"
                  className="font-mono text-xs py-1 px-2.5 bg-muted hover:bg-muted/80 text-foreground border"
                >
                  {action}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Quick Action (if permitted) */}
      {canAccessAdmin && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-blue-950 dark:text-blue-200">
                  Administrative Identity Management
                </CardTitle>
                <CardDescription className="text-blue-800/80 dark:text-blue-300/80">
                  You have administrative privileges. Manage users, roles, groups, and policies in the IAM Console.
                </CardDescription>
              </div>
              <Link href="/admin">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Open IAM Console
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
