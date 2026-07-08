"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const errors_1 = require("./../../core/errors");
const api_response_1 = require("./../../shared/responses/api-response");
const logger_1 = require("./../../infrastructure/logger/logger");
function errorMiddleware(err, req, res, next) {
    let error = err;
    if (!(error instanceof errors_1.AppError)) {
        error = new errors_1.AppError("Internal Server Error", 500, errors_1.ErrorCodes.INTERNAL_SERVER_ERROR, false);
    }
    logger_1.logger.error({
        requestId: req.requestId,
        message: error.message,
        stack: error.stack,
    });
    const appError = error;
    return api_response_1.ApiResponse.error(res, appError.statusCode, appError.message, {
        code: appError.code,
        ...(process.env.NODE_ENV !== "production" ? { stack: appError.stack } : {})
    });
}
//# sourceMappingURL=error.middleware.js.map