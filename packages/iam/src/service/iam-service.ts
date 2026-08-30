import { eq, and, sql, inArray } from 'drizzle-orm';
import type { DatabaseInstance } from '@packages/db';
import {
  users,
  roles,
  groups,
  policies,
  policyStatements,
  userRoles,
  userGroups,
  rolePolicies,
  groupPolicies,
  userPolicies,
  systemAuditLogs,
} from '@packages/db';
import type { IdentityType, UserStatus } from '@packages/auth';
import type {
  CreateRole,
  UpdateRole,
  CreateGroup,
  UpdateGroup,
  CreatePolicy,
  UpdatePolicy,
  PolicyStatement,
  UserListQuery,
  EffectivePermissionsResponse,
} from '@packages/validation';
import { PolicyEngine, type IdentitySubject } from '../policy/policy-engine.js';
import { permissionCatalog } from '../catalog/permission-catalog.js';

export class IamService {
  constructor(private db: DatabaseInstance) {}

  // ---------------------------------------------------------------------------
  // AUDIT LOGGING HELPER
  // ---------------------------------------------------------------------------
  public async logAuditEvent(params: {
    action: string;
    actor?: string;
    target?: string;
    status?: 'success' | 'failure';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.db.insert(systemAuditLogs).values({
        action: params.action,
        actor: params.actor || 'system',
        status: params.status || 'success',
        details: {
          target: params.target,
          ...params.details,
        },
      });
    } catch {
      // Do not let audit log failures crash main operation
    }
  }

  // ---------------------------------------------------------------------------
  // USERS & EFFECTIVE PERMISSIONS
  // ---------------------------------------------------------------------------
  public async listUsers(query: UserListQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.search) {
      conditions.push(
        sql`(${users.email} ILIKE ${`%${query.search}%`} OR ${users.name} ILIKE ${`%${query.search}%`})`
      );
    }
    if (query.status) {
      conditions.push(eq(users.status, query.status));
    }
    if (query.identityType) {
      conditions.push(eq(users.identityType, query.identityType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const userRows = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        identityType: users.identityType,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);

    return {
      data: userRows,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async getUserById(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        identityType: users.identityType,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return null;

    // Fetch user roles, groups, direct policies
    const userRoleList = await this.getUserRoles(userId);
    const userGroupList = await this.getUserGroups(userId);
    const userDirectPolicies = await this.getUserDirectPolicies(userId);

    return {
      ...user,
      roles: userRoleList,
      groups: userGroupList,
      directPolicies: userDirectPolicies,
    };
  }

  public async updateUserStatus(userId: string, status: UserStatus, actor = 'system') {
    const [updated] = await this.db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (updated) {
      await this.logAuditEvent({
        action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ACTIVATED',
        actor,
        target: userId,
        details: { status, email: updated.email },
      });
    }

    return updated;
  }

  public async getUserRoles(userId: string) {
    const records = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return records;
  }

  public async getUserGroups(userId: string) {
    const records = await this.db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        isSystem: groups.isSystem,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
      })
      .from(userGroups)
      .innerJoin(groups, eq(userGroups.groupId, groups.id))
      .where(eq(userGroups.userId, userId));

    return records;
  }

  public async getUserDirectPolicies(userId: string) {
    const records = await this.db
      .select({
        id: policies.id,
        name: policies.name,
        description: policies.description,
        isSystem: policies.isSystem,
        createdAt: policies.createdAt,
        updatedAt: policies.updatedAt,
      })
      .from(userPolicies)
      .innerJoin(policies, eq(userPolicies.policyId, policies.id))
      .where(eq(userPolicies.userId, userId));

    return records;
  }

  public async assignRoleToUser(userId: string, roleId: string, actor = 'system') {
    await this.db
      .insert(userRoles)
      .values({ userId, roleId })
      .onConflictDoNothing();

    await this.logAuditEvent({
      action: 'ROLE_ASSIGNED',
      actor,
      target: userId,
      details: { roleId },
    });
  }

  public async removeRoleFromUser(userId: string, roleId: string, actor = 'system') {
    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

    await this.logAuditEvent({
      action: 'ROLE_REMOVED',
      actor,
      target: userId,
      details: { roleId },
    });
  }

  public async addUserToGroup(userId: string, groupId: string, actor = 'system') {
    await this.db
      .insert(userGroups)
      .values({ userId, groupId })
      .onConflictDoNothing();

    await this.logAuditEvent({
      action: 'USER_ADDED_TO_GROUP',
      actor,
      target: userId,
      details: { groupId },
    });
  }

  public async removeUserFromGroup(userId: string, groupId: string, actor = 'system') {
    await this.db
      .delete(userGroups)
      .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId)));

    await this.logAuditEvent({
      action: 'USER_REMOVED_FROM_GROUP',
      actor,
      target: userId,
      details: { groupId },
    });
  }

  public async attachPolicyToUser(userId: string, policyId: string, actor = 'system') {
    await this.db
      .insert(userPolicies)
      .values({ userId, policyId })
      .onConflictDoNothing();

    await this.logAuditEvent({
      action: 'POLICY_ATTACHED_TO_USER',
      actor,
      target: userId,
      details: { policyId },
    });
  }

  public async detachPolicyFromUser(userId: string, policyId: string, actor = 'system') {
    await this.db
      .delete(userPolicies)
      .where(and(eq(userPolicies.userId, userId), eq(userPolicies.policyId, policyId)));

    await this.logAuditEvent({
      action: 'POLICY_DETACHED_FROM_USER',
      actor,
      target: userId,
      details: { policyId },
    });
  }

  /**
   * Retrieves all policy statements that apply to a given user:
   * 1. Statements from direct user policies
   * 2. Statements from policies attached to user's roles
   * 3. Statements from policies attached to user's groups
   */
  public async getUserStatements(userId: string): Promise<PolicyStatement[]> {
    // 1. Direct user policy IDs
    const direct = await this.db
      .select({ policyId: userPolicies.policyId })
      .from(userPolicies)
      .where(eq(userPolicies.userId, userId));

    // 2. Role policy IDs
    const rolePols = await this.db
      .select({ policyId: rolePolicies.policyId })
      .from(userRoles)
      .innerJoin(rolePolicies, eq(userRoles.roleId, rolePolicies.roleId))
      .where(eq(userRoles.userId, userId));

    // 3. Group policy IDs
    const groupPols = await this.db
      .select({ policyId: groupPolicies.policyId })
      .from(userGroups)
      .innerJoin(groupPolicies, eq(userGroups.groupId, groupPolicies.groupId))
      .where(eq(userGroups.userId, userId));

    const allPolicyIds = Array.from(
      new Set([
        ...direct.map((d) => d.policyId),
        ...rolePols.map((r) => r.policyId),
        ...groupPols.map((g) => g.policyId),
      ])
    );

    if (allPolicyIds.length === 0) {
      return [];
    }

    const statements = await this.db
      .select({
        id: policyStatements.id,
        effect: policyStatements.effect,
        actions: policyStatements.actions,
        resources: policyStatements.resources,
        conditions: policyStatements.conditions,
      })
      .from(policyStatements)
      .where(inArray(policyStatements.policyId, allPolicyIds));

    return statements.map((s) => ({
      id: s.id,
      effect: s.effect as 'allow' | 'deny',
      actions: s.actions,
      resources: s.resources,
      conditions: s.conditions as Record<string, unknown> | undefined,
    }));
  }

  /**
   * Calculates the full effective permissions and resolution breakdown for a user.
   */
  public async getEffectivePermissions(userId: string): Promise<EffectivePermissionsResponse> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const identity: IdentitySubject = {
      id: user.id,
      email: user.email,
      name: user.name,
      identityType: user.identityType as IdentityType,
      status: user.status as UserStatus,
    };

    const directPols = await this.getUserDirectPolicies(userId);
    const userRoleList = await this.getUserRoles(userId);
    const userGroupList = await this.getUserGroups(userId);
    const statements = await this.getUserStatements(userId);

    // Collect all policies
    const allPoliciesMap = new Map<string, any>();
    for (const p of directPols) allPoliciesMap.set(p.id, p);

    for (const r of userRoleList) {
      const pols = await this.getRolePolicies(r.id);
      for (const p of pols) allPoliciesMap.set(p.id, p);
    }
    for (const g of userGroupList) {
      const pols = await this.getGroupPolicies(g.id);
      for (const p of pols) allPoliciesMap.set(p.id, p);
    }

    const effectivePermissions = PolicyEngine.computeEffectivePermissions(identity, statements);

    return {
      identity: {
        id: user.id,
        email: user.email,
        name: user.name,
        identityType: user.identityType as IdentityType,
        status: user.status as UserStatus,
      },
      directPolicies: directPols.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        isSystem: p.isSystem,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      roles: userRoleList.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      groups: userGroupList.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        isSystem: g.isSystem,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
      allPolicies: Array.from(allPoliciesMap.values()).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        isSystem: p.isSystem,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      effectivePermissions,
    };
  }

  // ---------------------------------------------------------------------------
  // ROLES
  // ---------------------------------------------------------------------------
  public async listRoles() {
    const roleRows = await this.db.select().from(roles).orderBy(roles.name);
    return roleRows;
  }

  public async getRoleById(roleId: string) {
    const [role] = await this.db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) return null;

    const policiesList = await this.getRolePolicies(roleId);
    return { ...role, policies: policiesList };
  }

  public async createRole(data: CreateRole, actor = 'system') {
    const [role] = await this.db
      .insert(roles)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    if (data.policyIds && data.policyIds.length > 0) {
      for (const policyId of data.policyIds) {
        await this.attachPolicyToRole(role.id, policyId, actor);
      }
    }

    await this.logAuditEvent({
      action: 'ROLE_CREATED',
      actor,
      target: role.id,
      details: { name: role.name },
    });

    return role;
  }

  public async updateRole(roleId: string, data: UpdateRole, actor = 'system') {
    const [updated] = await this.db
      .update(roles)
      .set({
        name: data.name,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId))
      .returning();

    if (data.policyIds !== undefined) {
      // Replace policies
      await this.db.delete(rolePolicies).where(eq(rolePolicies.roleId, roleId));
      for (const policyId of data.policyIds) {
        await this.attachPolicyToRole(roleId, policyId, actor);
      }
    }

    await this.logAuditEvent({
      action: 'ROLE_UPDATED',
      actor,
      target: roleId,
      details: { name: updated?.name },
    });

    return updated;
  }

  public async deleteRole(roleId: string, actor = 'system') {
    const [deleted] = await this.db.delete(roles).where(eq(roles.id, roleId)).returning();
    if (deleted) {
      await this.logAuditEvent({
        action: 'ROLE_DELETED',
        actor,
        target: roleId,
        details: { name: deleted.name },
      });
    }
    return deleted;
  }

  public async getRolePolicies(roleId: string) {
    const records = await this.db
      .select({
        id: policies.id,
        name: policies.name,
        description: policies.description,
        isSystem: policies.isSystem,
        createdAt: policies.createdAt,
        updatedAt: policies.updatedAt,
      })
      .from(rolePolicies)
      .innerJoin(policies, eq(rolePolicies.policyId, policies.id))
      .where(eq(rolePolicies.roleId, roleId));

    return records;
  }

  public async attachPolicyToRole(roleId: string, policyId: string, actor = 'system') {
    await this.db.insert(rolePolicies).values({ roleId, policyId }).onConflictDoNothing();
    await this.logAuditEvent({
      action: 'POLICY_ATTACHED_TO_ROLE',
      actor,
      target: roleId,
      details: { policyId },
    });
  }

  public async detachPolicyFromRole(roleId: string, policyId: string, actor = 'system') {
    await this.db
      .delete(rolePolicies)
      .where(and(eq(rolePolicies.roleId, roleId), eq(rolePolicies.policyId, policyId)));
    await this.logAuditEvent({
      action: 'POLICY_DETACHED_FROM_ROLE',
      actor,
      target: roleId,
      details: { policyId },
    });
  }

  // ---------------------------------------------------------------------------
  // GROUPS
  // ---------------------------------------------------------------------------
  public async listGroups() {
    const groupRows = await this.db.select().from(groups).orderBy(groups.name);
    return groupRows;
  }

  public async getGroupById(groupId: string) {
    const [group] = await this.db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return null;

    const policiesList = await this.getGroupPolicies(groupId);
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userGroups)
      .where(eq(userGroups.groupId, groupId));

    return {
      ...group,
      memberCount: countResult?.count || 0,
      policies: policiesList,
    };
  }

  public async createGroup(data: CreateGroup, actor = 'system') {
    const [group] = await this.db
      .insert(groups)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    if (data.policyIds && data.policyIds.length > 0) {
      for (const policyId of data.policyIds) {
        await this.attachPolicyToGroup(group.id, policyId, actor);
      }
    }

    await this.logAuditEvent({
      action: 'GROUP_CREATED',
      actor,
      target: group.id,
      details: { name: group.name },
    });

    return group;
  }

  public async updateGroup(groupId: string, data: UpdateGroup, actor = 'system') {
    const [updated] = await this.db
      .update(groups)
      .set({
        name: data.name,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    if (data.policyIds !== undefined) {
      await this.db.delete(groupPolicies).where(eq(groupPolicies.groupId, groupId));
      for (const policyId of data.policyIds) {
        await this.attachPolicyToGroup(groupId, policyId, actor);
      }
    }

    await this.logAuditEvent({
      action: 'GROUP_UPDATED',
      actor,
      target: groupId,
      details: { name: updated?.name },
    });

    return updated;
  }

  public async deleteGroup(groupId: string, actor = 'system') {
    const [deleted] = await this.db.delete(groups).where(eq(groups.id, groupId)).returning();
    if (deleted) {
      await this.logAuditEvent({
        action: 'GROUP_DELETED',
        actor,
        target: groupId,
        details: { name: deleted.name },
      });
    }
    return deleted;
  }

  public async getGroupPolicies(groupId: string) {
    const records = await this.db
      .select({
        id: policies.id,
        name: policies.name,
        description: policies.description,
        isSystem: policies.isSystem,
        createdAt: policies.createdAt,
        updatedAt: policies.updatedAt,
      })
      .from(groupPolicies)
      .innerJoin(policies, eq(groupPolicies.policyId, policies.id))
      .where(eq(groupPolicies.groupId, groupId));

    return records;
  }

  public async attachPolicyToGroup(groupId: string, policyId: string, actor = 'system') {
    await this.db.insert(groupPolicies).values({ groupId, policyId }).onConflictDoNothing();
    await this.logAuditEvent({
      action: 'POLICY_ATTACHED_TO_GROUP',
      actor,
      target: groupId,
      details: { policyId },
    });
  }

  public async detachPolicyFromGroup(groupId: string, policyId: string, actor = 'system') {
    await this.db
      .delete(groupPolicies)
      .where(and(eq(groupPolicies.groupId, groupId), eq(groupPolicies.policyId, policyId)));
    await this.logAuditEvent({
      action: 'POLICY_DETACHED_FROM_GROUP',
      actor,
      target: groupId,
      details: { policyId },
    });
  }

  // ---------------------------------------------------------------------------
  // POLICIES & STATEMENTS
  // ---------------------------------------------------------------------------
  public async listPolicies() {
    const policyRows = await this.db.select().from(policies).orderBy(policies.name);
    return policyRows;
  }

  public async getPolicyById(policyId: string) {
    const [policy] = await this.db
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .limit(1);

    if (!policy) return null;

    const statements = await this.db
      .select()
      .from(policyStatements)
      .where(eq(policyStatements.policyId, policyId));

    return {
      ...policy,
      statements: statements.map((s) => ({
        id: s.id,
        effect: s.effect as 'allow' | 'deny',
        actions: s.actions,
        resources: s.resources,
        conditions: s.conditions,
      })),
    };
  }

  public async createPolicy(data: CreatePolicy, actor = 'system') {
    const [policy] = await this.db
      .insert(policies)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    for (const stmt of data.statements) {
      await this.db.insert(policyStatements).values({
        policyId: policy.id,
        effect: stmt.effect,
        actions: stmt.actions,
        resources: stmt.resources || ['*'],
        conditions: stmt.conditions,
      });
    }

    await this.logAuditEvent({
      action: 'POLICY_CREATED',
      actor,
      target: policy.id,
      details: { name: policy.name, statementCount: data.statements.length },
    });

    return policy;
  }

  public async updatePolicy(policyId: string, data: UpdatePolicy, actor = 'system') {
    const [updated] = await this.db
      .update(policies)
      .set({
        name: data.name,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(policies.id, policyId))
      .returning();

    if (data.statements !== undefined) {
      await this.db.delete(policyStatements).where(eq(policyStatements.policyId, policyId));
      for (const stmt of data.statements) {
        await this.db.insert(policyStatements).values({
          policyId,
          effect: stmt.effect,
          actions: stmt.actions,
          resources: stmt.resources || ['*'],
          conditions: stmt.conditions,
        });
      }
    }

    await this.logAuditEvent({
      action: 'POLICY_UPDATED',
      actor,
      target: policyId,
      details: { name: updated?.name },
    });

    return updated;
  }

  public async deletePolicy(policyId: string, actor = 'system') {
    const [deleted] = await this.db.delete(policies).where(eq(policies.id, policyId)).returning();
    if (deleted) {
      await this.logAuditEvent({
        action: 'POLICY_DELETED',
        actor,
        target: policyId,
        details: { name: deleted.name },
      });
    }
    return deleted;
  }

  // ---------------------------------------------------------------------------
  // PERMISSIONS
  // ---------------------------------------------------------------------------
  public async listPermissions() {
    return permissionCatalog.getAllPermissions();
  }
}
