"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
const errors_1 = require("./../../core/errors");
function notFoundMiddleware(req, res, next) {
    next(new errors_1.AppError(`Route ${req.originalUrl} not found`, 404, errors_1.ErrorCodes.RESOURCE_NOT_FOUND));
}
//# sourceMappingURL=not-found.middleware.js.map