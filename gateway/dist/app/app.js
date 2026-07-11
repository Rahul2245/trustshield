"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const internal_routes_1 = __importDefault(require("../modules/admin/routes/internal.routes"));
const env_1 = require("../config/env");
const request_logger_1 = require("../infrastructure/logger/request-logger");
const request_id_middleware_1 = require("./middlewares/request-id.middleware");
const not_found_middleware_1 = require("./middlewares/not-found.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
//global middlewares
app.use(request_id_middleware_1.requestIdMiddleware);
app.use(request_logger_1.requestLogger);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_ORIGIN,
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
//server health
app.get("/health", (_, res) => {
    res.status(200).json({
        success: true,
        message: "gateway is running",
    });
});
// Internal webhook routes (AI worker callbacks)
app.use("/api/internal", internal_routes_1.default);
// API Routes
app.use("/api/v1", routes_1.default);
app.use(not_found_middleware_1.notFoundMiddleware);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map