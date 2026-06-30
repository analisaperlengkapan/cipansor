import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * In Prisma 7 the datasource `url` is no longer read from `schema.prisma`.
 * Migration / introspection commands (migrate, db push, db pull) read the
 * connection string from here, while the runtime PrismaClient connects via the
 * `@prisma/adapter-pg` driver adapter configured in `src/lib/prisma.ts`.
 *
 * DATABASE_URL is constructed from individual DB_* env vars for DRY config.
 * A pre-built DATABASE_URL in the environment still takes precedence.
 */
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '5432';
  const name = process.env.DB_NAME ?? 'cipansor';
  return `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public`;
}

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: getDatabaseUrl(),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
