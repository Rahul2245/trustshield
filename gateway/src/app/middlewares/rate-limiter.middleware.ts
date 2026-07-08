import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import { redis } from "../../infrastructure/redis/redis";
import { AppError } from "../../core/errors/AppError";
import { AdminService } from "../../modules/admin/services/admin.service";
import { logger } from "../../infrastructure/logger/logger";

const adminService = new AdminService();

export const rateLimiterMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const forwarded = req.headers["x-forwarded-for"];
        const clientIp = typeof forwarded === "string"
            ? forwarded.split(",")[0].trim()
            : req.socket.remoteAddress || "unknown_ip";
        const targetAccount = req.body?.email || "unknown_account";
        
        const windowSeconds = 60;
        const ipTrackingKey = `rate:ip:${clientIp}`;
        const accountTrackingKey = `rate:account:${targetAccount}`;

        const redisClient = redis.getClient();
        
        const results = await redisClient.multi()
            .incr(ipTrackingKey)
            .incr(accountTrackingKey)
            .exec();

        if (!results || results.length !== 2) {
            return next();
        }

        const ipCount = results[0][1] as number;
        const accountCount = results[1][1] as number;

        if (ipCount === 1) await redisClient.expire(ipTrackingKey, windowSeconds);
        if (accountCount === 1) await redisClient.expire(accountTrackingKey, windowSeconds);

        if (ipCount > 5 || accountCount > 5) {
            adminService.createRateLimitAlert({
                ipAddress: clientIp,
                email: req.body?.email,
                correlationId: req.requestId || uuidv4(),
            }).catch(err => logger.error(err, "Failed to broadcast rate limit alert"));

            throw new AppError(
                "Too many requests, please try again later.",
                429,
                "RATE_LIMIT_EXCEEDED"
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};
