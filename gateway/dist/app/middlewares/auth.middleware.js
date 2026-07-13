"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const AppError_1 = require("../../core/errors/AppError");
const redis_1 = require("../../infrastructure/redis/redis");
const jwt_1 = require("../../infrastructure/security/jwt");
const logger_1 = require("../../infrastructure/logger/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError_1.AppError("Unauthorized access. Token not found.", 401, "UNAUTHORIZED");
        }
        const token = authHeader.split(" ")[1];
        const isBlacklisted = await redis_1.redisService.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError_1.AppError("Token has been revoked. Please log in again.", 401, "TOKEN_REVOKED");
        }
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };
            next();
        }
        catch (err) {
            logger_1.logger.warn(err, "JWT verification failed");
            throw new AppError_1.AppError("Invalid or expired token.", 401, "INVALID_TOKEN");
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }
        const token = authHeader.split(" ")[1];
        const isBlacklisted = await redis_1.redisService.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return next();
        }
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
        }
        catch (err) {
            // Ignore invalid token in optional auth
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map