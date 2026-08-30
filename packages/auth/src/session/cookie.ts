export interface CookieOptions {
  name: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
}

export function getSessionCookieOptions(isProduction: boolean, ttlSeconds = 604800, cookieName = 'app_session'): CookieOptions {
  return {
    name: cookieName,
    maxAge: ttlSeconds,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/',
  };
}
