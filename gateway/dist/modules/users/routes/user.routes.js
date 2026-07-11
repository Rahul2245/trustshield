"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../../../app/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/me', auth_middleware_1.authMiddleware, user_controller_1.userController.getMyProfile);
router.put('/me', auth_middleware_1.authMiddleware, user_controller_1.userController.updateProfile);
router.get('/:id', user_controller_1.userController.getPublicProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map