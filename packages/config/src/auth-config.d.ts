/**
 * Authentication and Session Configuration
 *
 * Developers can modify these settings to customize registration, session durations,
 * and security rules without modifying internal auth logic.
 */
export declare const AuthConfig: {
    /**
     * Whether public registration (/signup) is enabled.
     * If false, users can only be created by administrators or through invitation.
     */
    readonly registrationEnabled: true;
    /**
     * Default identity type assigned to new self-registered users.
     */
    readonly defaultIdentity: "EXTERNAL_USER";
    /**
     * Active session lifetime in seconds (default: 7 days).
     */
    readonly sessionTtlSeconds: number;
    /**
     * Name of the HTTP-only cookie used to transmit session tokens.
     */
    readonly cookieName: "app_session";
    /**
     * Minimum password length requirement for new accounts and password updates.
     */
    readonly minPasswordLength: 8;
    /**
     * Maximum failed login attempts before temporary lockout consideration.
     */
    readonly maxLoginAttempts: 5;
};
export type AuthConfigType = typeof AuthConfig;
//# sourceMappingURL=auth-config.d.ts.map