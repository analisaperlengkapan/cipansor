import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7 client factory for standalone scripts (seeds, maintenance scripts).
 *
 * These run outside the API process so they cannot reuse `src/lib/prisma.ts`
 * (which depends on the app config / `@` path alias). They share the same
 * driver-adapter connection strategy.
 */
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '5432';
  const name = process.env.DB_NAME ?? 'cipansor';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=public`;
}

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}
