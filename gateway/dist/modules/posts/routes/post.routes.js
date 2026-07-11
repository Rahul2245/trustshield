"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../../../app/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', post_controller_1.postController.getPosts);
router.get('/:id', post_controller_1.postController.getPostById);
// Authenticated routes
router.post('/', auth_middleware_1.authMiddleware, post_controller_1.postController.createPost);
router.post('/:id/upvote', auth_middleware_1.authMiddleware, post_controller_1.postController.upvotePost);
router.post('/:id/downvote', auth_middleware_1.authMiddleware, post_controller_1.postController.downvotePost);
router.get('/user/my-posts', auth_middleware_1.authMiddleware, post_controller_1.postController.getMyPosts);
exports.default = router;
//# sourceMappingURL=post.routes.js.map