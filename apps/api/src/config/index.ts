import dotenv from 'dotenv';
import path from 'path';
import { findSecretIssues } from './assert-secrets';
import { parseCorsOrigins } from './cors';

// Load apps/api/.env (works from both src/ via tsx and dist/ when compiled,
// since each sits directly under apps/api), then the repo-root .env as a
// fallback for anything not set (dotenv never overrides existing vars).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DEFAULT_JWT_SECRET = 'change-this-secret-in-production';

/**
 * Resolve the JWT signing secret. In production a missing, placeholder, or
 * short secret is a fatal misconfiguration: every token in the system could
 * be forged. Refuse to boot. Outside production, fall back to the dev default.
 *
 * The judgement of what counts as a bad secret is delegated to
 * `findSecretIssues` rather than repeated here. The earlier version compared
 * against `DEFAULT_JWT_SECRET` alone — an exact match on the code's own
 * fallback — which missed the value production was actually running:
 * "your-super-secret-key-change-this-in-production-min-32-chars", taken from
 * .env.example. It is 60 characters and is not the code default, so it passed
 * both tests while being published in a public repository. One rule, one
 * place, so the next placeholder cannot slip between two definitions of "bad".
 */
export function resolveJwtSecret(secret: string | undefined, env: string | undefined): string {
  if (env === 'production') {
    const issues = findSecretIssues({ jwtSecret: secret });
    const jwtIssue = issues.find((i) => i.variable === 'JWT_SECRET');
    if (jwtIssue) {
      throw new Error(`JWT_SECRET ${jwtIssue.reason}`);
    }
    return secret as string;
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
    // A list, not a string — see config/cors.ts for why the raw value must
    // never reach the `cors` middleware directly.
    origins: parseCorsOrigins(process.env.CORS_ORIGIN || 'http://localhost:3000'),
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

  /**
   * Public customer-service chatbot.
   *
   * Disabled by default and inert without credentials: with no provider
   * configured the endpoint answers 503 and the web widget does not render.
   * That is deliberate — a half-configured assistant that improvises answers
   * about fees and admission dates is worse than no assistant.
   *
   * `provider` accepts `openai-compatible` (Azure AI Foundry, Azure OpenAI, or
   * any gateway speaking POST {base}/chat/completions), `stub` (deterministic,
   * development only), or `disabled`.
   */
  chatbot: {
    provider: process.env.CHATBOT_PROVIDER || 'disabled',
    baseUrl: process.env.CHATBOT_API_BASE_URL,
    apiKey: process.env.CHATBOT_API_KEY,
    model: process.env.CHATBOT_MODEL,
    timeoutMs: parseInt(process.env.CHATBOT_TIMEOUT_MS || '20000', 10),
    maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS || '400', 10),
    // Facts, not prose. Kept low so the same question yields the same answer,
    // which is also what makes the eval harness meaningful.
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.2'),
    /** Turns of prior conversation replayed to the model, oldest dropped first. */
    maxHistoryTurns: parseInt(process.env.CHATBOT_MAX_HISTORY_TURNS || '6', 10),
    /**
     * An open LLM endpoint on a public page is a cost-amplification target, so
     * this is far stricter than the general API limiter.
     */
    rateLimit: {
      windowMs: parseInt(process.env.CHATBOT_RATE_LIMIT_WINDOW_MS || '60000', 10),
      maxRequests: parseInt(process.env.CHATBOT_RATE_LIMIT_MAX_REQUESTS || '10', 10),
    },
  },
} as const;

export type Config = typeof config;
