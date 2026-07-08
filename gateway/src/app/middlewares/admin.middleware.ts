import { Request, Response, NextFunction } from "express";

import { UserRole } from "../../core/enums/user-role.enum";
import { AppError } from "../../core/errors/AppError";

export const adminMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const role = req.user?.role;

    if (!role || (role !== UserRole.ADMIN && role !== UserRole.ANALYST)) {
        next(new AppError("Admin access required.", 403, "FORBIDDEN"));
        return;
    }

    next();
};
