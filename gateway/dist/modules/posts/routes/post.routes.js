"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../../../app/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', post_controller_1.postController.getPosts);
router.get('/feed', auth_middleware_1.optionalAuthMiddleware, post_controller_1.postController.getFeed);
router.get('/trending-topics', post_controller_1.postController.getTrendingTopics);
router.get('/:id', post_controller_1.postController.getPostById);
// Authenticated routes
router.post('/', auth_middleware_1.authMiddleware, post_controller_1.postController.createPost);
router.post('/:id/upvote', auth_middleware_1.authMiddleware, post_controller_1.postController.upvotePost);
router.post('/:id/downvote', auth_middleware_1.authMiddleware, post_controller_1.postController.downvotePost);
router.post('/:id/vote', auth_middleware_1.authMiddleware, post_controller_1.postController.toggleVote);
router.post('/:id/report', auth_middleware_1.authMiddleware, post_controller_1.postController.reportPost);
router.get('/user/my-posts', auth_middleware_1.authMiddleware, post_controller_1.postController.getMyPosts);
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, '../../../../../uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, (0, uuid_1.v4)() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.post('/upload', auth_middleware_1.authMiddleware, upload.single('media'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url: fileUrl });
});
exports.default = router;
//# sourceMappingURL=post.routes.js.map