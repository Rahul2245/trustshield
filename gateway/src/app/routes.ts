import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes";
import adminRoutes from "../modules/admin/routes/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

export default router;
