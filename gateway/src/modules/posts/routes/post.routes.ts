import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../../app/middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', postController.getPosts);
router.get('/feed', optionalAuthMiddleware, postController.getFeed);
router.get('/trending-topics', postController.getTrendingTopics);
router.get('/:id', postController.getPostById);

// Authenticated routes
router.post('/', authMiddleware, postController.createPost);

router.post('/:id/upvote', authMiddleware, postController.upvotePost);
router.post('/:id/downvote', authMiddleware, postController.downvotePost);
router.post('/:id/vote', authMiddleware, postController.toggleVote);
router.post('/:id/report', authMiddleware, postController.reportPost);
router.get('/user/my-posts', authMiddleware, postController.getMyPosts);

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../../../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/upload', authMiddleware, upload.single('media'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, url: fileUrl });
});

export default router;
