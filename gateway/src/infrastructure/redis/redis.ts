import Redis from "ioredis";
import { env } from "../../config/env";
import { logger } from "../logger/logger";

class RedisClient {
    private client: Redis;

    constructor() {
        // console.log(env.REDIS_URL);
        this.client = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: null,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on("connect", () => {
            logger.info("Redis connected successfully");
        });

        this.client.on("error", (err) => {
            logger.error(err, "Redis connection error");
        });
    }

    public getClient(): Redis {
        return this.client;
    }

    public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    public async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    public async del(key: string): Promise<void> {
        await this.client.del(key);
    }
}

export const redis = new RedisClient();
