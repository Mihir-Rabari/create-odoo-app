'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/iam/users', label: 'Users' },
  { href: '/admin/iam/roles', label: 'Roles' },
  { href: '/admin/iam/groups', label: 'Groups' },
  { href: '/admin/iam/policies', label: 'Policies' },
  { href: '/admin/iam/permissions', label: 'Permissions' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isRoot, hasPermission } = useAuth();

  const canAccessAdmin = isRoot || hasPermission('admin:access');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 md:flex-row">
        <Skeleton className="h-64 w-full shrink-0 rounded-lg md:w-56" />
        <Skeleton className="h-96 flex-1 rounded-lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in required</h1>
        <p className="text-sm text-muted-foreground">
          The admin area needs an account with the{' '}
          <code className="font-mono text-xs">admin:access</code> permission.
        </p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Not allowed</h1>
        <p className="text-sm text-muted-foreground">
          <code className="font-mono text-xs text-foreground">{user.email}</code> doesn&apos;t have
          the <code className="font-mono text-xs text-foreground">admin:access</code> permission.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-8 md:flex-row">
      <aside className="w-full shrink-0 space-y-6 md:w-56">
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {ADMIN_NAV.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden space-y-0.5 px-3 text-xs text-muted-foreground md:block">
          <div>Signed in as</div>
          <div className="truncate text-foreground">{user.email}</div>
          <div className="font-mono">{user.identityType}</div>
        </div>
      </aside>

      <div className="w-full min-w-0 flex-1">{children}</div>
    </div>
  );
}
