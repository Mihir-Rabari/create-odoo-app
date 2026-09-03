'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import {
  BookOpen,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
  LayoutDashboard,
  UserPlus } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isLoading, isRoot, hasPermission, logout } = useAuth();
  const canAccessAdmin = isRoot || hasPermission('admin:access');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center space-x-2 font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-mono">
              PS
            </div>
            <span>Production Starter</span>
          </Link>
          <Badge variant="outline" className="text-xs font-mono">
            Phase 2: Identity & IAM
          </Badge>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {canAccessAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors font-semibold"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>IAM Admin</span>
            </Link>
          )}

          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>OpenAPI</span>
          </a>

          <div className="h-4 w-[1px] bg-border hidden sm:block" />

          <ThemeToggle />

          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-xs text-foreground bg-muted px-2.5 py-1 rounded-md hover:bg-muted/80 transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span className="font-medium max-w-[120px] truncate">{user.name || user.email}</span>
                <Badge
                  variant={user.identityType === 'ROOT' ? 'destructive' : 'secondary'}
                  className="text-[10px] px-1 py-0 ml-1 uppercase"
                >
                  {user.identityType === 'ROOT' ? '👑 ROOT' : user.identityType}
                </Badge>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-8 text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
