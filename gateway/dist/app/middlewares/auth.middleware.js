"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const user_role_enum_1 = require("../../core/enums/user-role.enum");
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
            const isAdminRoute = req.path.includes('/admin');
            const isAdminRole = [
                user_role_enum_1.UserRole.ADMIN,
                user_role_enum_1.UserRole.ANALYST,
                user_role_enum_1.UserRole.SUPER_ADMIN,
                user_role_enum_1.UserRole.SECURITY_ADMIN,
                user_role_enum_1.UserRole.MODERATOR,
                user_role_enum_1.UserRole.ORG_MANAGER,
            ].includes(decoded.role);
            if (isAdminRoute && !isAdminRole) {
                throw new AppError_1.AppError("Admin access required. User tokens not accepted here.", 403, "FORBIDDEN");
            }
            if (!isAdminRoute && isAdminRole) {
                // If it's auth/me or auth/logout we can let it pass, but wait, we have /auth/admin/logout for admin
                // So strictly speaking, user routes shouldn't accept admin tokens.
                if (req.path !== '/me' && !req.path.includes('/auth/logout')) { // allow some shared paths if necessary, otherwise block
                    throw new AppError_1.AppError("User access required. Admin tokens not accepted here.", 403, "FORBIDDEN");
                }
            }
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