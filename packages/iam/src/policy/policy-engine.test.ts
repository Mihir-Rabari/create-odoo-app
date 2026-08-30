import { describe, it, expect } from 'vitest';
import { PolicyEngine, matchesActionPattern, type IdentitySubject } from './policy-engine.js';
import type { PolicyStatement } from '@packages/validation';

describe('Policy Engine & Pattern Matching', () => {
  describe('matchesActionPattern', () => {
    it('should match exact actions', () => {
      expect(matchesActionPattern('users:read', 'users:read')).toBe(true);
      expect(matchesActionPattern('users:read', 'users:write')).toBe(false);
    });

    it('should match wildcard star (*)', () => {
      expect(matchesActionPattern('*', 'users:read')).toBe(true);
      expect(matchesActionPattern('*', 'anything:custom')).toBe(true);
    });

    it('should match namespace wildcards (namespace:*)', () => {
      expect(matchesActionPattern('users:*', 'users:read')).toBe(true);
      expect(matchesActionPattern('users:*', 'users:delete')).toBe(true);
      expect(matchesActionPattern('users:*', 'roles:read')).toBe(false);
    });
  });

  describe('PolicyEngine.evaluate', () => {
    const rootUser: IdentitySubject = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'root@example.com',
      identityType: 'ROOT',
      status: 'ACTIVE',
    };

    const externalUser: IdentitySubject = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'user@example.com',
      identityType: 'EXTERNAL_USER',
      status: 'ACTIVE',
    };

    const suspendedUser: IdentitySubject = {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'suspended@example.com',
      identityType: 'EXTERNAL_USER',
      status: 'SUSPENDED',
    };

    it('should grant all actions to ROOT identity unconditionally', () => {
      const decision = PolicyEngine.evaluate({
        identity: rootUser,
        action: 'any:restricted:action',
        statements: [], // No statements needed for ROOT
      });

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toContain('Root identity');
    });

    it('should reject suspended and disabled accounts immediately', () => {
      const decision = PolicyEngine.evaluate({
        identity: suspendedUser,
        action: 'profile:read:self',
        statements: [{ effect: 'allow', actions: ['*'], resources: ['*'] }],
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('suspended');
    });

    it('should enforce EXPLICIT DENY PRECEDENCE over Allow statements', () => {
      const statements: PolicyStatement[] = [
        {
          effect: 'allow',
          actions: ['users:*'],
          resources: ['*'],
        },
        {
          effect: 'deny',
          actions: ['users:delete'],
          resources: ['*'],
        },
      ];

      // Read is allowed because users:* matches and no deny matches
      const readDecision = PolicyEngine.evaluate({
        identity: externalUser,
        action: 'users:read',
        statements,
      });
      expect(readDecision.allowed).toBe(true);

      // Delete is DENIED because explicit deny overrides allow
      const deleteDecision = PolicyEngine.evaluate({
        identity: externalUser,
        action: 'users:delete',
        statements,
      });
      expect(deleteDecision.allowed).toBe(false);
      expect(deleteDecision.reason).toContain('Explicit deny');
    });

    it('should verify resource ownership for :self actions', () => {
      const statements: PolicyStatement[] = [
        {
          effect: 'allow',
          actions: ['profile:update:self'],
          resources: ['*'],
        },
      ];

      // Accessing own resource -> ALLOWED
      const selfDecision = PolicyEngine.evaluate({
        identity: externalUser,
        action: 'profile:update:self',
        statements,
        context: { resourceOwnerId: externalUser.id },
      });
      expect(selfDecision.allowed).toBe(true);

      // Attempting to modify another user's resource -> DENIED
      const otherDecision = PolicyEngine.evaluate({
        identity: externalUser,
        action: 'profile:update:self',
        statements,
        context: { resourceOwnerId: '99999999-9999-9999-9999-999999999999' },
      });
      expect(otherDecision.allowed).toBe(false);
    });

    it('should return implicit deny when no statements match', () => {
      const statements: PolicyStatement[] = [
        {
          effect: 'allow',
          actions: ['notifications:*'],
          resources: ['*'],
        },
      ];

      const decision = PolicyEngine.evaluate({
        identity: externalUser,
        action: 'users:read',
        statements,
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Implicit deny');
    });
  });

  describe('PolicyEngine.computeEffectivePermissions', () => {
    it('should compute allowed permissions list from statements', () => {
      const identity: IdentitySubject = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'user@example.com',
        identityType: 'EXTERNAL_USER',
        status: 'ACTIVE',
      };

      const statements: PolicyStatement[] = [
        {
          effect: 'allow',
          actions: ['profile:read:self', 'profile:update:self'],
          resources: ['*'],
        },
      ];

      const effective = PolicyEngine.computeEffectivePermissions(identity, statements);
      expect(effective).toContain('profile:read:self');
      expect(effective).toContain('profile:update:self');
      expect(effective).not.toContain('users:delete');
    });
  });
});
