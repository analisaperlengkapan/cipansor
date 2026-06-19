import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '@/config';

// Declare global prisma to prevent multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Prisma 7 connects through a driver adapter rather than a `datasource.url`.
 * We use the node-postgres adapter (`@prisma/adapter-pg`) backed by a single
 * connection pool sourced from `DATABASE_URL`.
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}

// Create prisma instance (reused in development to avoid connection storms)
export const prisma = global.__prisma || createPrismaClient();

// In development, store in global to prevent too many connections
if (config.env === 'development') {
  global.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
