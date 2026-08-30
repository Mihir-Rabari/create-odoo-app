import { z } from 'zod';
import { EmailSchema, NonEmptyStringSchema } from './common.js';

export const UserStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const IdentityTypeEnum = z.enum(['ROOT', 'EXTERNAL_USER']);
export type IdentityType = z.infer<typeof IdentityTypeEnum>;

export const SignupRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: NonEmptyStringSchema,
  // If a client attempts to pass role, strip it or ignore
  role: z.string().optional(),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  status: UserStatusEnum,
  identityType: IdentityTypeEnum,
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthSessionInfoSchema = z.object({
  id: z.string().uuid(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type AuthSessionInfo = z.infer<typeof AuthSessionInfoSchema>;

export const SessionResponseSchema = z.object({
  user: AuthUserSchema,
  session: AuthSessionInfoSchema,
  effectivePermissions: z.array(z.string()),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: EmailSchema.optional(),
});
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
