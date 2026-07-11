"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/routes/auth.routes"));
const admin_routes_1 = __importDefault(require("../modules/admin/routes/admin.routes"));
const post_routes_1 = __importDefault(require("../modules/posts/routes/post.routes"));
const comment_routes_1 = __importDefault(require("../modules/comments/routes/comment.routes"));
const organization_routes_1 = __importDefault(require("../modules/organizations/routes/organization.routes"));
const user_routes_1 = __importDefault(require("../modules/users/routes/user.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/admin", admin_routes_1.default);
router.use("/posts", post_routes_1.default);
router.use("/comments", comment_routes_1.default);
router.use("/organizations", organization_routes_1.default);
router.use("/users", user_routes_1.default);
exports.default = router;
//# sourceMappingURL=routes.js.map