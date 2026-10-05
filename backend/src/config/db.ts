import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Configure SQLite for enhanced concurrency (WAL mode & busy timeout)
if (process.env.NODE_ENV !== 'test' && !process.argv.some(arg => arg.includes('test'))) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;'))
    .catch((err) => console.error('Failed to configure SQLite pragmas:', err));
}

// Graceful process shutdown
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error disconnecting Prisma:', e);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
