'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useIamUsers,
  useIamRoles,
  useIamGroups,
  useIamPolicies,
  useIamPermissions,
} from '@/hooks/use-iam';
import {
  Users,
  ShieldCheck,
  FolderTree,
  FileCode2,
  Key,
  ArrowRight,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { data: usersData, isLoading: usersLoading } = useIamUsers({ limit: 1 });
  const { data: rolesData, isLoading: rolesLoading } = useIamRoles();
  const { data: groupsData, isLoading: groupsLoading } = useIamGroups();
  const { data: policiesData, isLoading: policiesLoading } = useIamPolicies();
  const { data: permissionsData, isLoading: permsLoading } = useIamPermissions();

  const totalUsers = usersData?.meta.totalItems ?? 0;
  const totalRoles = rolesData?.length ?? 0;
  const totalGroups = groupsData?.length ?? 0;
  const totalPolicies = policiesData?.length ?? 0;
  const totalPerms = permissionsData?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">IAM Control Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identity management, policy configuration, group governance, and role-based access control
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[11px] uppercase font-semibold">Users</CardDescription>
            <CardTitle className="text-2xl">
              {usersLoading ? <span className="animate-pulse">...</span> : totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link href="/admin/iam/users" className="text-[11px] text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[11px] uppercase font-semibold">Roles</CardDescription>
            <CardTitle className="text-2xl">
              {rolesLoading ? <span className="animate-pulse">...</span> : totalRoles}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link href="/admin/iam/roles" className="text-[11px] text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[11px] uppercase font-semibold">Groups</CardDescription>
            <CardTitle className="text-2xl">
              {groupsLoading ? <span className="animate-pulse">...</span> : totalGroups}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link href="/admin/iam/groups" className="text-[11px] text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[11px] uppercase font-semibold">Policies</CardDescription>
            <CardTitle className="text-2xl">
              {policiesLoading ? <span className="animate-pulse">...</span> : totalPolicies}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link href="/admin/iam/policies" className="text-[11px] text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[11px] uppercase font-semibold">Permissions</CardDescription>
            <CardTitle className="text-2xl">
              {permsLoading ? <span className="animate-pulse">...</span> : totalPerms}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link href="/admin/iam/permissions" className="text-[11px] text-primary hover:underline flex items-center gap-1">
              Browse <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Architecture & Evaluation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>IAM Evaluation Architecture</span>
          </CardTitle>
          <CardDescription>
            Deterministic evaluation order implemented by @packages/iam
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              1. Root Superuser Authority
            </div>
            <p className="text-muted-foreground">
              If identity is <code className="font-mono text-primary">ROOT</code>, all requested actions across all namespaces are unconditionally authorized.
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
              2. Explicit Deny Precedence
            </div>
            <p className="text-muted-foreground">
              If any policy statement (direct, role, or group) contains <code className="font-mono text-destructive">effect: deny</code> matching the action, access is immediately blocked.
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              3. Allow & Self-Ownership
            </div>
            <p className="text-muted-foreground">
              If an allow statement matches, self-resource permissions (e.g. <code className="font-mono text-xs">:self</code>) enforce <code className="font-mono text-xs">resourceOwnerId === identity.id</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>User Identity Administration</span>
            </CardTitle>
            <CardDescription>
              View accounts, suspend or disable access, and calculate live effective permissions for any user
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/iam/users">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Browse All Users</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <span>Policy & Statement Authoring</span>
            </CardTitle>
            <CardDescription>
              Create granular Allow / Deny policy statements and attach them to groups or roles
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/iam/policies">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Manage Policies</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
