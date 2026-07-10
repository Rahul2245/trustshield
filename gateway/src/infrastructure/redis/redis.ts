import { createClient } from 'redis';
import { env } from '../../config/env';
import { logger } from '../logger/logger';

class RedisService {
  private client;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => logger.error('Redis Client Error', err));
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Connected to Redis successfully');
    });
    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });
  }

  public async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  public getClient() {
    return this.client;
  }

  // Phase 5 Implementations
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return; // Soft fallback
    await this.client.set(key, value);
    if (ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
  }

  public async setLock(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected) return true; // Fail open
    const result = await this.client.set(key, value, { NX: true, EX: ttlSeconds });
    return result === 'OK';
  }

  public async delete(key: string): Promise<void> {
    if (!this.isConnected) return;
    await this.client.del(key);
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null; // Soft fallback
    return await this.client.get(key);
  }

  public async blacklistToken(token: string, expiresIn: number): Promise<void> {
    if (!this.isConnected) return;
    await this.set(`bl_${token}`, 'blacklisted', expiresIn);
  }

  public async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.isConnected) return false; // Fail open if Redis crashes
    const val = await this.get(`bl_${token}`);
    return val !== null;
  }
}

export const redisService = new RedisService();

// Alias so both `import { redis }` and `import { redisService }` work
export const redis = redisService;
