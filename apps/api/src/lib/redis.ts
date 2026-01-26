import Redis from 'ioredis';
import { config } from '@/config';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.warn('Redis connection error:', err.message);
});

redis.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Redis connected');
});
