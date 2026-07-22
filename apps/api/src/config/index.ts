import dotenv from 'dotenv';
import path from 'path';

// Load apps/api/.env (works from both src/ via tsx and dist/ when compiled,
// since each sits directly under apps/api), then the repo-root .env as a
// fallback for anything not set (dotenv never overrides existing vars).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DEFAULT_JWT_SECRET = 'change-this-secret-in-production';

/**
 * Resolve the JWT signing secret. In production a missing, placeholder, or
 * short secret is a fatal misconfiguration: every token in the system could
 * be forged. Refuse to boot (same policy as the ENCRYPTION_KEY guard in
 * utils/encryption.ts). Outside production, fall back to the dev default.
 */
export function resolveJwtSecret(
  secret: string | undefined,
  env: string | undefined
): string {
  if (env === 'production') {
    if (!secret || secret === DEFAULT_JWT_SECRET || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a random string of at least 32 characters in production'
      );
    }
    return secret;
  }
  return secret || DEFAULT_JWT_SECRET;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  jwt: {
    secret: resolveJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV),
    // Access tokens are short-lived so that role/permission changes and
    // offboarding take effect within minutes; the web client refreshes
    // transparently via /auth/refresh (see apps/web/src/lib/api.ts).
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  bcrypt: {
    saltRounds: 10,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    // Auth (login/2FA) limiter. Deliberately strict by default — this guards
    // against credential brute-force. CI/e2e environments that need more
    // headroom should raise RATE_LIMIT_AUTH_MAX_REQUESTS via env instead of
    // weakening the production default.
    auth: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5', 10),
    },
  },

  log: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

} as const;

export type Config = typeof config;
