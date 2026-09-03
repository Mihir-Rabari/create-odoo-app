'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  ShieldCheck,
  Key,
  Clock,
  CheckCircle2,
  LogIn,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, session, effectivePermissions, isAuthenticated, isLoading, isRoot, hasPermission } =
    useAuth();

  if (isLoading) {
    return (
      <div className="container py-12 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-20 max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
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
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20 shadow">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>Welcome, {user.name}</span>
              {isRoot && (
                <Badge variant="destructive" className="text-xs uppercase">
                  ROOT AUTHORITY
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Active session: <code className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">{user.email}</code>
            </p>
          </div>
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
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <ShieldCheck className="mr-2 h-4 w-4" />
                IAM Admin Console
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Identity Status
            </CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="capitalize">{user.status.toLowerCase()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <div>
              Type: <strong className="text-foreground">{user.identityType}</strong>
            </div>
            <div>
              User ID: <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{user.id}</code>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Session Lifetime
            </CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <div>
              Expires: {session ? new Date(session.expiresAt).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              Security: <strong className="text-foreground">HTTP-Only Cookie</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              IAM Authority
            </CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <span>{isRoot ? 'Unrestricted' : `${effectivePermissions.length} Actions`}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
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
      <Card className="border-border">
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
              <p className="text-muted-foreground leading-relaxed">
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
        <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Administrative Identity Management
                </CardTitle>
                <CardDescription className="mt-1">
                  You have administrative privileges. Manage users, roles, groups, and policies in the IAM Console.
                </CardDescription>
              </div>
              <Link href="/admin">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0">
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
