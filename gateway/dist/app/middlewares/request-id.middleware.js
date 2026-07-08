"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const node_crypto_1 = require("node:crypto");
function requestIdMiddleware(req, res, next) {
    const requestId = (0, node_crypto_1.randomUUID)();
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
}
//# sourceMappingURL=request-id.middleware.js.map