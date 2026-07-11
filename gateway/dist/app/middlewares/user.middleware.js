"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const user_role_enum_1 = require("../../core/enums/user-role.enum");
const AppError_1 = require("../../core/errors/AppError");
const userMiddleware = (req, _res, next) => {
    const role = req.user?.role;
    if (!role || role !== user_role_enum_1.UserRole.USER) {
        next(new AppError_1.AppError("User access required. Admins cannot perform this action.", 403, "FORBIDDEN"));
        return;
    }
    next();
};
exports.userMiddleware = userMiddleware;
//# sourceMappingURL=user.middleware.js.map