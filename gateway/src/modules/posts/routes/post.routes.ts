import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authMiddleware } from '../../../app/middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', postController.getPosts);
router.get('/feed', postController.getFeed);
router.get('/trending-topics', postController.getTrendingTopics);
router.get('/:id', postController.getPostById);

// Authenticated routes
router.post('/', authMiddleware, postController.createPost);

router.post('/:id/upvote', authMiddleware, postController.upvotePost);
router.post('/:id/downvote', authMiddleware, postController.downvotePost);
router.post('/:id/vote', authMiddleware, postController.toggleVote);
router.get('/user/my-posts', authMiddleware, postController.getMyPosts);

export default router;
