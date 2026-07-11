"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterMiddleware = void 0;
const uuid_1 = require("uuid");
const redis_1 = require("../../infrastructure/redis/redis");
const AppError_1 = require("../../core/errors/AppError");
const admin_service_1 = require("../../modules/admin/services/admin.service");
const logger_1 = require("../../infrastructure/logger/logger");
const adminService = new admin_service_1.AdminService();
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        const forwarded = req.headers["x-forwarded-for"];
        const clientIp = typeof forwarded === "string"
            ? forwarded.split(",")[0].trim()
            : req.socket.remoteAddress || "unknown_ip";
        const targetAccount = req.body?.email || "unknown_account";
        const windowSeconds = 60;
        const maxRequests = 10;
        const ipTrackingKey = `rate:ip:${clientIp}`;
        const accountTrackingKey = `rate:account:${targetAccount}`;
        // Use safe redisService methods - gracefully skip if Redis is down
        try {
            const client = redis_1.redisService.getClient();
            const ipCount = await client.incr(ipTrackingKey);
            if (ipCount === 1)
                await client.expire(ipTrackingKey, windowSeconds);
            const accountCount = await client.incr(accountTrackingKey);
            if (accountCount === 1)
                await client.expire(accountTrackingKey, windowSeconds);
            console.log("DEBUG RATE LIMIT", { ipTrackingKey, accountTrackingKey, ipCount, accountCount });
            if (ipCount > maxRequests || accountCount > maxRequests) {
                adminService.createRateLimitAlert({
                    ipAddress: clientIp,
                    email: req.body?.email,
                    correlationId: req.requestId || (0, uuid_1.v4)(),
                }).catch(err => logger_1.logger.error(err, "Failed to broadcast rate limit alert"));
                throw new AppError_1.AppError("Too many requests, please try again later.", 429, "RATE_LIMIT_EXCEEDED");
            }
        }
        catch (redisErr) {
            // If it's our own rate limit error, re-throw it
            if (redisErr instanceof AppError_1.AppError)
                throw redisErr;
            // Otherwise, Redis is just down - log and continue
            logger_1.logger.warn({ redisErr }, "Rate limiter Redis error - skipping rate limit check");
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
//# sourceMappingURL=rate-limiter.middleware.js.map