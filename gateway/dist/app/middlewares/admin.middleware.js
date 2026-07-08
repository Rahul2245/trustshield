"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const user_role_enum_1 = require("../../core/enums/user-role.enum");
const AppError_1 = require("../../core/errors/AppError");
const adminMiddleware = (req, _res, next) => {
    const role = req.user?.role;
    if (!role || (role !== user_role_enum_1.UserRole.ADMIN && role !== user_role_enum_1.UserRole.ANALYST)) {
        next(new AppError_1.AppError("Admin access required.", 403, "FORBIDDEN"));
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=admin.middleware.js.map