'use client';

import React from 'react';
import { useIamPermissions } from '@/hooks/use-iam';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Shield } from 'lucide-react';
import type { Permission } from '@packages/validation';

export default function PermissionsCatalogPage() {
  const { data: permissions, isLoading } = useIamPermissions();

  // Group permissions by namespace
  const grouped = React.useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.namespace]) {
        acc[perm.namespace] = [];
      }
      acc[perm.namespace].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          <span>System Permissions Catalog</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registered system and feature action registry used in policy statement authorization
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading permission catalog...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No permissions registered in catalog.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([namespace, perms]) => (
            <Card key={namespace}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base uppercase tracking-wider font-mono text-primary flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{namespace}</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    {perms.length} Actions
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="divide-y text-xs">
                  {perms.map((p) => (
                    <div
                      key={p.id}
                      className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                          {p.id}
                        </code>
                        {p.isSystem && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            System
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px] sm:text-right">
                        {p.description || 'No description provided'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
