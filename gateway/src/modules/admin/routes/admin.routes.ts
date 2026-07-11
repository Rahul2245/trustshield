import { Router } from "express";

import { authMiddleware } from "../../../app/middlewares/auth.middleware";
import { adminMiddleware } from "../../../app/middlewares/admin.middleware";
import { AdminController } from "../controllers/admin.controller";

const router = Router();
const adminController = new AdminController();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", adminController.getStats);
router.get("/trend", adminController.getTrend);
router.get("/threats", adminController.getThreats);
router.get("/threats/:eventId", adminController.getThreatById);
router.get("/alerts", adminController.getAlerts);
router.get("/alerts/:alertId", adminController.getAlertById);
router.post("/alerts/:alertId/lock", adminController.lockAlert);
router.patch("/alerts/:alertId/acknowledge", adminController.acknowledgeAlert);
router.get("/users", adminController.getUsers);
router.patch("/users/:userId/status", adminController.updateUserStatus);

export default router;
