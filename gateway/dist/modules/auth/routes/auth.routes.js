"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rate_limiter_middleware_1 = require("../../../app/middlewares/rate-limiter.middleware");
const auth_middleware_1 = require("../../../app/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// User Routes
router.post('/register', authController.register);
router.post('/login', rate_limiter_middleware_1.rateLimiterMiddleware, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', auth_middleware_1.authMiddleware, authController.logoutAll);
router.get('/me', auth_middleware_1.authMiddleware, authController.me);
// Admin Routes (using same controller endpoints that have isAdminRoute checks based on path)
router.post('/admin/login', rate_limiter_middleware_1.rateLimiterMiddleware, authController.adminLogin);
router.post('/admin/refresh', authController.refresh);
router.post('/admin/logout', authController.logout);
router.post('/admin/logout-all', auth_middleware_1.authMiddleware, authController.logoutAll);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map