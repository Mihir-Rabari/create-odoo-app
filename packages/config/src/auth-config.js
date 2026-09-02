/**
 * Authentication and Session Configuration
 *
 * Developers can modify these settings to customize registration, session durations,
 * and security rules without modifying internal auth logic.
 */
export const AuthConfig = {
    /**
     * Whether public registration (/signup) is enabled.
     * If false, users can only be created by administrators or through invitation.
     */
    registrationEnabled: true,
    /**
     * Default identity type assigned to new self-registered users.
     */
    defaultIdentity: 'EXTERNAL_USER',
    /**
     * Active session lifetime in seconds (default: 7 days).
     */
    sessionTtlSeconds: 7 * 24 * 60 * 60,
    /**
     * Name of the HTTP-only cookie used to transmit session tokens.
     */
    cookieName: 'app_session',
    /**
     * Minimum password length requirement for new accounts and password updates.
     */
    minPasswordLength: 8,
    /**
     * Maximum failed login attempts before temporary lockout consideration.
     */
    maxLoginAttempts: 5,
};
//# sourceMappingURL=auth-config.js.map