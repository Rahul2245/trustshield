"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const api_response_1 = require("../../shared/responses/api-response");
const errors_1 = require("../../core/errors");
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (!result.success) {
            return api_response_1.ApiResponse.error(res, 400, "Validation failed", {
                code: errors_1.ErrorCodes.VALIDATION_ERROR,
                details: result.error.flatten(),
            });
        }
        req.body = result.data?.body;
        next();
    };
}
//# sourceMappingURL=validation.middleware.js.map