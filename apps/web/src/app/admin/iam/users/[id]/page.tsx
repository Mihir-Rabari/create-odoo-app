'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useIamUser,
  useIamUserPermissions,
  useIamRoles,
  useIamGroups,
  useIamPolicies,
  useUpdateUserStatus,
  useAssignRole,
  useRemoveRole,
  useAddUserToGroup,
  useRemoveUserFromGroup,
  useAttachDirectPolicy,
  useDetachDirectPolicy,
} from '@/hooks/use-iam';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ChevronLeft,
  Key,
  ShieldCheck,
  FolderTree,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { UserStatus } from '@packages/validation';

export default function UserInspectorPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading: userLoading, refetch: refetchUser } = useIamUser(userId);
  const { data: effectiveData, isLoading: permsLoading, refetch: refetchPerms } =
    useIamUserPermissions(userId);

  const { data: allRoles } = useIamRoles();
  const { data: allGroups } = useIamGroups();
  const { data: allPolicies } = useIamPolicies();

  const updateStatusMutation = useUpdateUserStatus();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();
  const addGroupMutation = useAddUserToGroup();
  const removeGroupMutation = useRemoveUserFromGroup();
  const attachPolicyMutation = useAttachDirectPolicy();
  const detachPolicyMutation = useDetachDirectPolicy();

  // Selected assignment dropdowns
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold">User Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested user identity does not exist.</p>
        <Link href="/admin/iam/users">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>
    );
  }

  const isRoot = user.identityType === 'ROOT';

  const handleStatusChange = async (newStatus: UserStatus) => {
    await updateStatusMutation.mutateAsync({ id: userId, data: { status: newStatus } });
    refetchUser();
    refetchPerms();
  };

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    await assignRoleMutation.mutateAsync({ userId, roleId: selectedRole });
    setSelectedRole('');
    refetchUser();
    refetchPerms();
  };

  const handleRemoveRole = async (roleId: string) => {
    await removeRoleMutation.mutateAsync({ userId, roleId });
    refetchUser();
    refetchPerms();
  };

  const handleAddGroup = async () => {
    if (!selectedGroup) return;
    await addGroupMutation.mutateAsync({ userId, groupId: selectedGroup });
    setSelectedGroup('');
    refetchUser();
    refetchPerms();
  };

  const handleRemoveGroup = async (groupId: string) => {
    await removeGroupMutation.mutateAsync({ userId, groupId });
    refetchUser();
    refetchPerms();
  };

  const handleAttachPolicy = async () => {
    if (!selectedPolicy) return;
    await attachPolicyMutation.mutateAsync({ userId, policyId: selectedPolicy });
    setSelectedPolicy('');
    refetchUser();
    refetchPerms();
  };

  const handleDetachPolicy = async (policyId: string) => {
    await detachPolicyMutation.mutateAsync({ userId, policyId });
    refetchUser();
    refetchPerms();
  };

  // Available options not already assigned
  const availableRoles = allRoles?.filter((r) => !user.roles?.some((ur) => ur.id === r.id)) || [];
  const availableGroups =
    allGroups?.filter((g) => !user.groups?.some((ug) => ug.id === g.id)) || [];
  const availablePolicies =
    allPolicies?.filter((p) => !user.directPolicies?.some((up) => up.id === p.id)) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/iam/users"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>{user.name}</span>
              <Badge
                variant={isRoot ? 'destructive' : 'outline'}
                className="text-xs uppercase font-mono"
              >
                {isRoot ? '👑 ROOT' : user.identityType}
              </Badge>
              <Badge
                variant={
                  user.status === 'ACTIVE'
                    ? 'default'
                    : user.status === 'SUSPENDED'
                    ? 'secondary'
                    : 'destructive'
                }
                className="text-xs uppercase font-semibold"
              >
                {user.status}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{user.email}</p>
          </div>

          {!isRoot && (
            <div className="flex items-center gap-2">
              {user.status === 'ACTIVE' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('SUSPENDED')}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Suspend Account
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Activate Account
                </Button>
              )}

              {user.status !== 'DISABLED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('DISABLED')}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Disable Account
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Effective Permissions Breakdown */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Live Effective Permissions Breakdown</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Real-time calculation evaluated across direct user policies, group inheritance, and assigned roles
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {permsLoading ? 'Calculating...' : `${effectiveData?.effectivePermissions.length ?? 0} Actions Allowed`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {permsLoading ? (
            <div className="h-16 bg-muted animate-pulse rounded" />
          ) : !effectiveData || effectiveData.effectivePermissions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
              No effective permissions granted to this user.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {effectiveData.effectivePermissions.map((action) => (
                <Badge
                  key={action}
                  variant="secondary"
                  className="font-mono text-xs py-1 px-2.5 bg-background border text-foreground"
                >
                  {action}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* IAM Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Assigned Roles</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Roles bundled with access policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {!user.roles || user.roles.length === 0 ? (
              <p className="text-muted-foreground italic">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {user.roles.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{r.name}</div>
                      {r.description && (
                        <div className="text-[11px] text-muted-foreground">{r.description}</div>
                      )}
                    </div>
                    {!isRoot && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(r.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isRoot && availableRoles.length > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">Select role to assign...</option>
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAssignRole} disabled={!selectedRole} className="h-7 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              <span>Group Memberships</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Groups propagating attached policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {!user.groups || user.groups.length === 0 ? (
              <p className="text-muted-foreground italic">No group memberships</p>
            ) : (
              <div className="space-y-2">
                {user.groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{g.name}</div>
                      {g.description && (
                        <div className="text-[11px] text-muted-foreground">{g.description}</div>
                      )}
                    </div>
                    {!isRoot && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGroup(g.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isRoot && availableGroups.length > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">Select group to join...</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAddGroup} disabled={!selectedGroup} className="h-7 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Direct Policies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <span>Direct Policies</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Policies attached directly to this user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {!user.directPolicies || user.directPolicies.length === 0 ? (
              <p className="text-muted-foreground italic">No direct policies attached</p>
            ) : (
              <div className="space-y-2">
                {user.directPolicies.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-muted-foreground">{p.description}</div>
                      )}
                    </div>
                    {!isRoot && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDetachPolicy(p.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isRoot && availablePolicies.length > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <select
                  value={selectedPolicy}
                  onChange={(e) => setSelectedPolicy(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">Select policy to attach...</option>
                  {availablePolicies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAttachPolicy} disabled={!selectedPolicy} className="h-7 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
