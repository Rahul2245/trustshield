import { Request, Response, NextFunction } from "express";

import { UserRole } from "../../core/enums/user-role.enum";
import { AppError } from "../../core/errors/AppError";

export const adminMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const role = req.user?.role;

    const adminRoles: string[] = [
        UserRole.ADMIN,
        UserRole.ANALYST,
        UserRole.SUPER_ADMIN,
        UserRole.SECURITY_ADMIN,
        UserRole.MODERATOR,
        UserRole.ORG_MANAGER,
    ];

    if (!role || !adminRoles.includes(role)) {
        if (req.user?.id) {
            import("../../modules/users/models/user.model.js").then(async ({ UserModel }) => {
                const user = await UserModel.findById(req.user!.id);
                if (user && user.role === UserRole.USER && !user.isUnderInvestigation) {
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

                    rabbitMQClient.publishThreatEvent(threatPayload as any).catch((err: any) => {
                        logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event for admin route access attempt');
                    });
                }
            }).catch(console.error);
        }

        next(new AppError("Admin access required.", 403, "FORBIDDEN"));
        return;
    }

    next();
};
