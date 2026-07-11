"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.redisService = void 0;
const redis_1 = require("redis");
const env_1 = require("../../config/env");
const logger_1 = require("../logger/logger");
class RedisService {
    client;
    isConnected = false;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: env_1.env.REDIS_URL || 'redis://localhost:6379',
        });
        this.client.on('error', (err) => logger_1.logger.error('Redis Client Error', err));
        this.client.on('connect', () => {
            this.isConnected = true;
            logger_1.logger.info('Connected to Redis successfully');
        });
        this.client.on('end', () => {
            this.isConnected = false;
            logger_1.logger.warn('Redis connection closed');
        });
    }
    async connect() {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }
    getClient() {
        return this.client;
    }
    // Phase 5 Implementations
    async set(key, value, ttlSeconds) {
        if (!this.isConnected)
            return; // Soft fallback
        await this.client.set(key, value);
        if (ttlSeconds) {
            await this.client.expire(key, ttlSeconds);
        }
    }
    async setLock(key, value, ttlSeconds) {
        if (!this.isConnected)
            return true; // Fail open
        const result = await this.client.set(key, value, { NX: true, EX: ttlSeconds });
        return result === 'OK';
    }
    async delete(key) {
        if (!this.isConnected)
            return;
        await this.client.del(key);
    }
    async get(key) {
        if (!this.isConnected)
            return null; // Soft fallback
        return await this.client.get(key);
    }
    async blacklistToken(token, expiresIn) {
        if (!this.isConnected)
            return;
        await this.set(`bl_${token}`, 'blacklisted', expiresIn);
    }
    async isTokenBlacklisted(token) {
        if (!this.isConnected)
            return false; // Fail open if Redis crashes
        const val = await this.get(`bl_${token}`);
        return val !== null;
    }
}
exports.redisService = new RedisService();
// Alias so both `import { redis }` and `import { redisService }` work
exports.redis = exports.redisService;
//# sourceMappingURL=redis.js.map