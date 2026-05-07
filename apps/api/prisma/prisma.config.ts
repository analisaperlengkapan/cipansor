import { defineConfig } from 'prisma';

export default defineConfig({
  schema: './schema.prisma',
  // In Prisma 7, connection strings can be managed here or via env
});
