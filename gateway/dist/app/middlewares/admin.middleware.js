"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const user_role_enum_1 = require("../../core/enums/user-role.enum");
const AppError_1 = require("../../core/errors/AppError");
const adminMiddleware = (req, _res, next) => {
    const role = req.user?.role;
    const adminRoles = [
        user_role_enum_1.UserRole.ADMIN,
        user_role_enum_1.UserRole.ANALYST,
        user_role_enum_1.UserRole.SUPER_ADMIN,
        user_role_enum_1.UserRole.SECURITY_ADMIN,
        user_role_enum_1.UserRole.MODERATOR,
        user_role_enum_1.UserRole.ORG_MANAGER,
    ];
    if (!role || !adminRoles.includes(role)) {
        if (req.user?.id) {
            import("../../modules/users/models/user.model.js").then(async ({ UserModel }) => {
                const user = await UserModel.findById(req.user.id);
                if (user && user.role === user_role_enum_1.UserRole.USER && !user.isUnderInvestigation) {
                    user.isUnderInvestigation = true;
                    await user.save();
                    const { v4: uuidv4 } = await import("uuid");
                    const { rabbitMQClient } = await import("../../infrastructure/rabbitmq/connection.js");
                    const { logger } = await import("../../infrastructure/logger/logger.js");
                    const threatPayload = {
                        eventId: uuidv4(),
                        eventType: 'ThreatAdminAccessAttempt',
                        userId: String(user._id),
                        email: user.email,
                        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
                        userAgent: req.headers['user-agent'] || 'unknown',
                        timestamp: new Date().toISOString(),
                        correlationId: uuidv4(),
                        requestId: req.requestId || uuidv4(),
                        metadata: {
                            burstVelocity: 0.0,
                            targetRecipientRatio: 0.0,
                            uriHyperlinkDensity: 0.0,
                            sessionDwellDuration: 0.0,
                            payloadText: `Standard user attempted to access the Admin Panel route: ${req.originalUrl}`,
                        }
                    };
                    rabbitMQClient.publishThreatEvent(threatPayload).catch((err) => {
                        logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event for admin route access attempt');
                    });
                }
            }).catch(console.error);
        }
        next(new AppError_1.AppError("Admin access required.", 403, "FORBIDDEN"));
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=admin.middleware.js.map