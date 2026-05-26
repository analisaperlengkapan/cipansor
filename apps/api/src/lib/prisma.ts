import { PrismaClient } from '@prisma/client';
import { config } from '@/config';

// Declare global prisma to prevent multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create prisma instance
export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// In development, store in global to prevent too many connections
if (config.env === 'development') {
  global.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
