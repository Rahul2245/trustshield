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
        next(new AppError("Admin access required.", 403, "FORBIDDEN"));
        return;
    }

    next();
};
