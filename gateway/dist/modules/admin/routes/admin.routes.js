"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../app/middlewares/auth.middleware");
const admin_middleware_1 = require("../../../app/middlewares/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
router.use(auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware);
router.get("/stats", adminController.getStats);
router.get("/trend", adminController.getTrend);
router.get("/threats", adminController.getThreats);
router.get("/threats/:eventId", adminController.getThreatById);
router.get("/alerts", adminController.getAlerts);
router.patch("/alerts/:alertId/acknowledge", adminController.acknowledgeAlert);
router.get("/users", adminController.getUsers);
router.patch("/users/:userId/status", adminController.updateUserStatus);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map