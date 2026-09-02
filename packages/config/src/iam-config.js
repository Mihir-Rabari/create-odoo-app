/**
 * Declarative IAM & Authorization Configuration
 *
 * Developers can define custom domain roles, groups, baseline policies,
 * and registration policies here without modifying the core authorization engine.
 */
export const IamConfig = {
    /**
     * Root superuser configuration
     */
    root: {
        enabled: true,
        authority: 'unconditional',
    },
    /**
     * Baseline system policies created on database seed
     */
    policies: {
        AdministratorPolicy: {
            description: 'Full administrative access to manage users, roles, groups, policies, and permissions',
            isSystem: true,
            statements: [
                {
                    effect: 'allow',
                    actions: ['admin:access', 'users:*', 'roles:*', 'groups:*', 'policies:*', 'permissions:*'],
                    resources: ['*'],
                },
            ],
        },
        ExternalUserPolicy: {
            description: 'Default baseline policy granting external users self-resource permissions',
            isSystem: true,
            statements: [
                {
                    effect: 'allow',
                    actions: [
                        'profile:read:self',
                        'profile:update:self',
                        'notifications:read:self',
                        'notifications:update:self',
                    ],
                    resources: ['*'],
                },
            ],
        },
    },
    /**
     * Baseline roles created on database seed with their attached policies
     */
    roles: {
        ADMIN: {
            description: 'System Administrator with full access to identity and system governance',
            isSystem: true,
            policies: ['AdministratorPolicy'],
        },
        USER: {
            description: 'Standard external user with baseline self-management capabilities',
            isSystem: true,
            policies: ['ExternalUserPolicy'],
        },
    },
    /**
     * Baseline groups created on database seed with their attached policies
     */
    groups: {
    // Developers can add domain groups here (e.g. 'Engineering', 'Moderators', 'Support')
    },
    /**
     * Registration policy defaults
     */
    registration: {
        defaultPolicy: 'ExternalUserPolicy',
        defaultRole: undefined,
        defaultGroup: undefined,
    },
};
//# sourceMappingURL=iam-config.js.map