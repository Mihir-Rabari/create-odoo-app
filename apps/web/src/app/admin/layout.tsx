'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShieldCheck,
  UserCheck,
  FileCode2,
  FolderTree,
  LayoutDashboard,
  ShieldAlert,
  LogIn,
  Key,
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/iam/users', label: 'Users', icon: Users },
  { href: '/admin/iam/roles', label: 'Roles', icon: ShieldCheck },
  { href: '/admin/iam/groups', label: 'Groups', icon: FolderTree },
  { href: '/admin/iam/policies', label: 'Policies', icon: FileCode2 },
  { href: '/admin/iam/permissions', label: 'Permissions Catalog', icon: Key },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isRoot, hasPermission } = useAuth();

  const canAccessAdmin = isRoot || hasPermission('admin:access');

  if (isLoading) {
    return (
      <div className="container py-12 max-w-7xl">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="md:col-span-3 h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-20 max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You must be authenticated as an administrator to view the IAM management console.
        </p>
        <Link href="/login">
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in as Administrator
          </Button>
        </Link>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className="container py-20 max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">403 - Forbidden</h1>
        <p className="text-sm text-muted-foreground">
          Your account (<code className="font-mono text-xs text-foreground">{user.email}</code>) does not possess the <code className="font-mono text-xs text-destructive">admin:access</code> permission required to enter this console.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Back to User Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          <div className="px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              IAM Management
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Access control & authorization
            </p>
          </div>

          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
            <div className="font-medium text-foreground flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>Acting Admin</span>
            </div>
            <div className="truncate">{user.email}</div>
            <div className="text-[10px] font-mono uppercase text-primary font-bold">
              {user.identityType}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
