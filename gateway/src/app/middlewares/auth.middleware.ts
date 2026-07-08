import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { jwtConfig } from "../../config/jwt.config";
import { UserRole } from "../../core/enums/user-role.enum";
import { AppError } from "../../core/errors/AppError";
import { redis } from "../../infrastructure/redis/redis";
import { JwtPayload, verifyAccessToken } from "../../infrastructure/security/jwt";
import { logger } from "../../infrastructure/logger/logger";

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

        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError("Token has been revoked. Please log in again.", 401, "TOKEN_REVOKED");
        }

        try {
            const decoded = verifyAccessToken(token) as JwtPayload;
            
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            next();
        } catch (err: unknown) {
            logger.warn(err, "JWT verification failed");
            throw new AppError("Invalid or expired token.", 401, "INVALID_TOKEN");
        }
    } catch (error) {
        next(error);
    }
};
