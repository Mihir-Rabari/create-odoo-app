'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogIn, Lock, Mail, AlertCircle, ShieldAlert, KeyRound } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Signed in successfully', {
        description: 'Welcome back to your workspace.',
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Login failed. Please check your credentials.');
      setError(msg);
      toast.error('Authentication failed', {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const prefillRoot = () => {
    setEmail('root@example.com');
    setPassword('RootSecurePass123!');
    setError(null);
    toast.info('Root credentials loaded', {
      description: 'Click Sign In to authenticate as ROOT.',
    });
  };

  return (
    <div className="container flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2 shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your session & permissions
          </p>
        </div>

        <Card className="border-border shadow-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Authentication</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  HTTP-Only Session
                </Badge>
              </div>
              <CardDescription>
                Use email & password to establish a cryptographic session
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>

              <div className="w-full text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Quick Root Bootstrap Helper */}
        <div className="rounded-lg border border-border bg-card/60 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5 text-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
              Developer Shortcut
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={prefillRoot}
              className="h-7 text-xs px-2"
            >
              Fill Root Credentials
            </Button>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Initial ROOT administrator bootstrapped from <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">.env</code>: <code className="font-mono text-primary font-semibold">root@example.com</code> / <code className="font-mono text-primary font-semibold">RootSecurePass123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
