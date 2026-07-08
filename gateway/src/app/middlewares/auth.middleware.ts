import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { redis } from "../../infrastructure/redis/redis";
import { AppError } from "../../core/errors/AppError";
import { logger } from "../../infrastructure/logger/logger";

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Unauthorized access. Token not found.", 401, "UNAUTHORIZED");
        }

        const token = authHeader.split(" ")[1];

        // Check if token is blacklisted in Redis
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError("Token has been revoked. Please log in again.", 401, "TOKEN_REVOKED");
        }

        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
            
            // Inject user payload to request
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            next();
        } catch (err: any) {
            logger.warn(err, "JWT verification failed");
            throw new AppError("Invalid or expired token.", 401, "INVALID_TOKEN");
        }
    } catch (error) {
        next(error);
    }
};
