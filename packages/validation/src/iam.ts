import { z } from 'zod';
import { NonEmptyStringSchema } from './common.js';
import { PaginationQuerySchema } from './pagination.js';
import { UserStatusEnum, IdentityTypeEnum } from './auth.js';

// Permission schemas
export const PermissionSchema = z.object({
  id: z.string().min(1),
  namespace: z.string().min(1),
  action: z.string().min(1),
  description: z.string().nullable().optional(),
  isSystem: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type Permission = z.infer<typeof PermissionSchema>;

// Policy Statement schemas
export const PolicyStatementEffectEnum = z.enum(['allow', 'deny']);
export type PolicyStatementEffect = z.infer<typeof PolicyStatementEffectEnum>;

export const PolicyStatementSchema = z.object({
  id: z.string().uuid().optional(),
  effect: PolicyStatementEffectEnum,
  actions: z.array(z.string().min(1)).min(1, 'At least one action is required'),
  resources: z.array(z.string()).default(['*']),
  conditions: z.record(z.unknown()).optional(),
});
export type PolicyStatement = z.infer<typeof PolicyStatementSchema>;

// Policy schemas
export const PolicySchema = z.object({
  id: z.string().uuid(),
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  isSystem: z.boolean().default(false),
  statements: z.array(PolicyStatementSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Policy = z.infer<typeof PolicySchema>;

export const CreatePolicySchema = z.object({
  name: NonEmptyStringSchema,
  description: z.string().optional(),
  statements: z.array(PolicyStatementSchema).min(1, 'At least one statement is required'),
});
export type CreatePolicy = z.infer<typeof CreatePolicySchema>;

export const UpdatePolicySchema = z.object({
  name: NonEmptyStringSchema.optional(),
  description: z.string().optional(),
  statements: z.array(PolicyStatementSchema).optional(),
});
export type UpdatePolicy = z.infer<typeof UpdatePolicySchema>;

// Role schemas
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  isSystem: z.boolean().default(false),
  policies: z.array(PolicySchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = z.object({
  name: NonEmptyStringSchema,
  description: z.string().optional(),
  policyIds: z.array(z.string().uuid()).optional(),
});
export type CreateRole = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = z.object({
  name: NonEmptyStringSchema.optional(),
  description: z.string().optional(),
  policyIds: z.array(z.string().uuid()).optional(),
});
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;

// Group schemas
export const GroupSchema = z.object({
  id: z.string().uuid(),
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  isSystem: z.boolean().default(false),
  memberCount: z.number().int().min(0).optional(),
  policies: z.array(PolicySchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Group = z.infer<typeof GroupSchema>;

export const CreateGroupSchema = z.object({
  name: NonEmptyStringSchema,
  description: z.string().optional(),
  policyIds: z.array(z.string().uuid()).optional(),
});
export type CreateGroup = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = z.object({
  name: NonEmptyStringSchema.optional(),
  description: z.string().optional(),
  policyIds: z.array(z.string().uuid()).optional(),
});
export type UpdateGroup = z.infer<typeof UpdateGroupSchema>;

// Assignment schemas
export const AttachPolicySchema = z.object({
  policyId: z.string().uuid(),
});
export type AttachPolicy = z.infer<typeof AttachPolicySchema>;

export const AssignRoleSchema = z.object({
  roleId: z.string().uuid(),
});
export type AssignRole = z.infer<typeof AssignRoleSchema>;

export const AddUserToGroupSchema = z.object({
  userId: z.string().uuid(),
});
export type AddUserToGroup = z.infer<typeof AddUserToGroupSchema>;

export const UpdateUserStatusSchema = z.object({
  status: UserStatusEnum,
});
export type UpdateUserStatus = z.infer<typeof UpdateUserStatusSchema>;

// Query and listing schemas
export const UserListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  status: UserStatusEnum.optional(),
  identityType: IdentityTypeEnum.optional(),
});
export type UserListQuery = z.infer<typeof UserListQuerySchema>;

// Effective permissions response
export const EffectivePermissionsResponseSchema = z.object({
  identity: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    identityType: IdentityTypeEnum,
    status: UserStatusEnum,
  }),
  directPolicies: z.array(PolicySchema),
  roles: z.array(RoleSchema),
  groups: z.array(GroupSchema),
  allPolicies: z.array(PolicySchema),
  effectivePermissions: z.array(z.string()),
});
export type EffectivePermissionsResponse = z.infer<typeof EffectivePermissionsResponseSchema>;
