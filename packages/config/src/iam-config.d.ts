/**
 * Declarative IAM & Authorization Configuration
 *
 * Developers can define custom domain roles, groups, baseline policies,
 * and registration policies here without modifying the core authorization engine.
 */
export interface RoleDefinition {
    description: string;
    isSystem?: boolean;
    policies: string[];
}
export interface GroupDefinition {
    description: string;
    isSystem?: boolean;
    policies: string[];
}
export interface PolicyStatementDefinition {
    effect: 'allow' | 'deny';
    actions: string[];
    resources?: string[];
    conditions?: Record<string, unknown>;
}
export interface PolicyDefinition {
    description: string;
    isSystem?: boolean;
    statements: PolicyStatementDefinition[];
}
export declare const IamConfig: {
    /**
     * Root superuser configuration
     */
    readonly root: {
        readonly enabled: true;
        readonly authority: "unconditional";
    };
    /**
     * Baseline system policies created on database seed
     */
    readonly policies: Record<string, PolicyDefinition>;
    /**
     * Baseline roles created on database seed with their attached policies
     */
    readonly roles: Record<string, RoleDefinition>;
    /**
     * Baseline groups created on database seed with their attached policies
     */
    readonly groups: Record<string, GroupDefinition>;
    /**
     * Registration policy defaults
     */
    readonly registration: {
        readonly defaultPolicy: "ExternalUserPolicy";
        readonly defaultRole: string | undefined;
        readonly defaultGroup: string | undefined;
    };
};
export type IamConfigType = typeof IamConfig;
//# sourceMappingURL=iam-config.d.ts.map