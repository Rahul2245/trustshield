"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, message, data, statusCode = 200) {
        const requestId = res.locals.requestId;
        return res.status(statusCode).json({
            success: true,
            requestId,
            message,
            data
        });
    }
    static error(res, statusCode, message, err) {
        const requestId = res.locals.requestId;
        return res.status(statusCode).json({
            success: false,
            requestId,
            message,
            error: err instanceof Error ? err.message : err
        });
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.js.map