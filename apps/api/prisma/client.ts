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
export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}
