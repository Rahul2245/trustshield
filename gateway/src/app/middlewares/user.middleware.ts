import { Request, Response, NextFunction } from "express";

import { UserRole } from "../../core/enums/user-role.enum";
import { AppError } from "../../core/errors/AppError";

export const userMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const role = req.user?.role;

    if (!role || role !== UserRole.USER) {
        next(new AppError("User access required. Admins cannot perform this action.", 403, "FORBIDDEN"));
        return;
    }

    next();
};
