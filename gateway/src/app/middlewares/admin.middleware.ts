import { Request, Response, NextFunction } from "express";

import { UserRole } from "../../core/enums/user-role.enum";
import { AppError } from "../../core/errors/AppError";

const ADMIN_ROLES: string[] = [
    UserRole.ADMIN,
    UserRole.ANALYST,
    UserRole.SUPER_ADMIN,
    UserRole.SECURITY_ADMIN,
    UserRole.MODERATOR,
    UserRole.ORG_MANAGER,
];

export const adminMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const role = req.user?.role;

    if (!role || !ADMIN_ROLES.includes(role)) {
        next(new AppError("Admin access required.", 403, "FORBIDDEN"));
        return;
    }

    next();
};
