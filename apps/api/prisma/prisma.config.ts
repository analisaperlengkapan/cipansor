import 'dotenv/config';
import { defineConfig } from 'prisma';

/**
 * Prisma 7 configuration.
 *
 * In Prisma 7 the datasource `url` is no longer read from `schema.prisma`.
 * Migration / introspection commands (migrate, db push, db pull) read the
 * connection string from here, while the runtime PrismaClient connects via the
 * `@prisma/adapter-pg` driver adapter configured in `src/lib/prisma.ts`.
 */
export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
