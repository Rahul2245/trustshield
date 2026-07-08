"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const redis_1 = require("../../infrastructure/redis/redis");
const AppError_1 = require("../../core/errors/AppError");
const logger_1 = require("../../infrastructure/logger/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError_1.AppError("Unauthorized access. Token not found.", 401, "UNAUTHORIZED");
        }
        const token = authHeader.split(" ")[1];
        // Check if token is blacklisted in Redis
        const isBlacklisted = await redis_1.redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError_1.AppError("Token has been revoked. Please log in again.", 401, "TOKEN_REVOKED");
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            // Inject user payload to request
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
//# sourceMappingURL=auth.middleware.js.map