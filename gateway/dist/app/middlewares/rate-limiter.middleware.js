"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterMiddleware = void 0;
const redis_1 = require("../../infrastructure/redis/redis");
const AppError_1 = require("../../core/errors/AppError");
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
        // Simple fallback for target account based on body
        const targetAccount = req.body?.email || "unknown_account";
        const windowSeconds = 60;
        const ipTrackingKey = `rate:ip:${clientIp}`;
        const accountTrackingKey = `rate:account:${targetAccount}`;
        const redisClient = redis_1.redis.getClient();
        // Execute atomic pipelined transactional updates concurrently
        const results = await redisClient.multi()
            .incr(ipTrackingKey)
            .incr(accountTrackingKey)
            .exec();
        if (!results || results.length !== 2) {
            return next(); // Fail open if redis issues
        }
        const ipCount = results[0][1];
        const accountCount = results[1][1];
        // Enforce sliding window bounds automatically
        if (ipCount === 1)
            await redisClient.expire(ipTrackingKey, windowSeconds);
        if (accountCount === 1)
            await redisClient.expire(accountTrackingKey, windowSeconds);
        if (ipCount > 5 || accountCount > 5) {
            throw new AppError_1.AppError("Too many requests, please try again later.", 429, "RATE_LIMIT_EXCEEDED");
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
//# sourceMappingURL=rate-limiter.middleware.js.map