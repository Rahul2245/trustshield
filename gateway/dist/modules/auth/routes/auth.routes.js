"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rate_limiter_middleware_1 = require("../../../app/middlewares/rate-limiter.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', authController.register);
router.post('/login', rate_limiter_middleware_1.rateLimiterMiddleware, authController.login);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map