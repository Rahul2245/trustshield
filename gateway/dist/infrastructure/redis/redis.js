"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
const logger_1 = require("../logger/logger");
class RedisClient {
    client;
    constructor() {
        this.client = new ioredis_1.default(env_1.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        this.client.on("connect", () => {
            logger_1.logger.info("Redis connected successfully");
        });
        this.client.on("error", (err) => {
            logger_1.logger.error(err, "Redis connection error");
        });
    }
    getClient() {
        return this.client;
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        return this.client.get(key);
    }
    async del(key) {
        await this.client.del(key);
    }
}
exports.redis = new RedisClient();
//# sourceMappingURL=redis.js.map