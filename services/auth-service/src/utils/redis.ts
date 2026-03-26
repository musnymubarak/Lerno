import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL!;

const host = REDIS_URL.split('@')[1] ?? REDIS_URL;
console.log(`🔌 [auth-service] Connecting to Redis at: ${host}`);

const redis = new Redis(REDIS_URL, {
  tls: {}, // Required for Upstash TLS (rediss://)
});

redis.on('connect', () => console.log('✅ [auth-service] Connected to Redis'));
redis.on('error', (err) => console.error('❌ [auth-service] Redis error:', err.message));

export default redis;
