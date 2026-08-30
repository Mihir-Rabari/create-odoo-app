import type { IdentityType, UserStatus } from '@packages/auth';
import type { PolicyStatement } from '@packages/validation';
import { permissionCatalog } from '../catalog/permission-catalog.js';

export interface AuthorizationContext {
  resourceOwnerId?: string;
  resourceId?: string;
  attributes?: Record<string, unknown>;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason: string;
}

export interface IdentitySubject {
  id: string;
  email: string;
  name?: string;
  identityType: IdentityType;
  status: UserStatus;
}

/**
 * Matches an action against a permission pattern.
 * e.g. "users:read" matches "users:read", "users:*", or "*"
 */
export function matchesActionPattern(pattern: string, requestedAction: string): boolean {
  if (pattern === '*' || pattern === requestedAction) {
    return true;
  }

  // Handle wildcard like "users:*"
  if (pattern.endsWith(':*')) {
    const patternPrefix = pattern.slice(0, -2);
    const [reqNamespace] = requestedAction.split(':');
    return patternPrefix === reqNamespace;
  }

  return false;
}

/**
 * Centralized authorization evaluation engine.
 */
export class PolicyEngine {
  /**
   * Evaluates if an identity is authorized to perform an action given their effective policy statements.
   */
  public static evaluate(params: {
    identity: IdentitySubject;
    action: string;
    statements: PolicyStatement[];
    context?: AuthorizationContext;
  }): AuthorizationDecision {
    const { identity, action, statements, context } = params;

    // 1. Inactive account check
    if (identity.status === 'SUSPENDED') {
      return { allowed: false, reason: 'Account is suspended' };
    }
    if (identity.status === 'DISABLED') {
      return { allowed: false, reason: 'Account is disabled' };
    }

    // 2. ROOT Identity Authority
    if (identity.identityType === 'ROOT') {
      return { allowed: true, reason: 'Root identity has full administrative authority' };
    }

    // 3. Explicit Deny Check (Deny Precedence)
    for (const statement of statements) {
      if (statement.effect === 'deny') {
        const matches = statement.actions.some((pattern) => matchesActionPattern(pattern, action));
        if (matches) {
          return { allowed: false, reason: 'Explicit deny statement matched' };
        }
      }
    }

    // 4. Allow Statements Check
    for (const statement of statements) {
      if (statement.effect === 'allow') {
        const matches = statement.actions.some((pattern) => matchesActionPattern(pattern, action));
        if (matches) {
          // Check resource ownership if action is a :self action or has ownership requirement
          if (action.endsWith(':self')) {
            if (context?.resourceOwnerId && context.resourceOwnerId !== identity.id) {
              // Ownership check failed for this statement, continue checking other statements
              continue;
            }
          }

          return { allowed: true, reason: 'Allowed by policy statement' };
        }
      }
    }

    // 5. Default Deny
    return { allowed: false, reason: 'Implicit deny (no allow statement matched)' };
  }

  /**
   * Computes the list of effective allowed permission identifiers from an array of policy statements.
   */
  public static computeEffectivePermissions(
    identity: IdentitySubject,
    statements: PolicyStatement[]
  ): string[] {
    const allCatalogPermissions = permissionCatalog.getAllPermissions();

    if (identity.identityType === 'ROOT') {
      return allCatalogPermissions.map((p) => p.id);
    }

    const effective: string[] = [];

    for (const perm of allCatalogPermissions) {
      const decision = PolicyEngine.evaluate({
        identity,
        action: perm.id,
        statements,
        context: { resourceOwnerId: identity.id }, // Assume self-context for permission discovery
      });

      if (decision.allowed) {
        effective.push(perm.id);
      }
    }

    return effective;
  }
}
