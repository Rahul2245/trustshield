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
        const ipTrackingKey = `rate:ip:${clientIp}`;
        const accountTrackingKey = `rate:account:${targetAccount}`;
        const redisClient = redis_1.redis.getClient();
        const results = await redisClient.multi()
            .incr(ipTrackingKey)
            .incr(accountTrackingKey)
            .exec();
        if (!results || results.length !== 2) {
            return next();
        }
        const ipCount = results[0][1];
        const accountCount = results[1][1];
        if (ipCount === 1)
            await redisClient.expire(ipTrackingKey, windowSeconds);
        if (accountCount === 1)
            await redisClient.expire(accountTrackingKey, windowSeconds);
        if (ipCount > 5 || accountCount > 5) {
            adminService.createRateLimitAlert({
                ipAddress: clientIp,
                email: req.body?.email,
                correlationId: req.requestId || (0, uuid_1.v4)(),
            }).catch(err => logger_1.logger.error(err, "Failed to broadcast rate limit alert"));
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