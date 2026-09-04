'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, isLoading, isRoot, hasPermission, logout } = useAuth();
  const pathname = usePathname();
  const canAccessAdmin = isRoot || hasPermission('admin:access');

  const links = [
    { href: '/dashboard', label: 'Dashboard', show: true },
    { href: '/admin', label: 'Admin', show: canAccessAdmin },
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          <span>Production Starter</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
              className={cn(
                'transition-colors hover:text-foreground',
                pathname.startsWith(link.href) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            API docs
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className="max-w-[160px] truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {user.name || user.email}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
