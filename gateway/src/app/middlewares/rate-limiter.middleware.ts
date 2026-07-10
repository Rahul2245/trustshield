import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import { redisService } from "../../infrastructure/redis/redis";
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
        const maxRequests = 10;
        const ipTrackingKey = `rate:ip:${clientIp}`;
        const accountTrackingKey = `rate:account:${targetAccount}`;

        // Use safe redisService methods - gracefully skip if Redis is down
        try {
            const client = redisService.getClient();
            
            const ipCount = await client.incr(ipTrackingKey);
            if (ipCount === 1) await client.expire(ipTrackingKey, windowSeconds);

            const accountCount = await client.incr(accountTrackingKey);
            if (accountCount === 1) await client.expire(accountTrackingKey, windowSeconds);

            console.log("DEBUG RATE LIMIT", { ipTrackingKey, accountTrackingKey, ipCount, accountCount });

            if (ipCount > maxRequests || accountCount > maxRequests) {
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
        } catch (redisErr) {
            // If it's our own rate limit error, re-throw it
            if (redisErr instanceof AppError) throw redisErr;
            // Otherwise, Redis is just down - log and continue
            logger.warn({ redisErr }, "Rate limiter Redis error - skipping rate limit check");
        }

        next();
    } catch (error) {
        next(error);
    }
};

