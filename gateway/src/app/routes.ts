import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes";
import adminRoutes from "../modules/admin/routes/admin.routes";
import postRoutes from "../modules/posts/routes/post.routes";
import commentRoutes from "../modules/comments/routes/comment.routes";
import organizationRoutes from "../modules/organizations/routes/organization.routes";
import userRoutes from "../modules/users/routes/user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/organizations", organizationRoutes);
router.use("/users", userRoutes);

export default router;
