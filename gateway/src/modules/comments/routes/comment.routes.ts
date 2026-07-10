import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authMiddleware } from '../../../app/middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, commentController.createComment);
router.get('/post/:postId', commentController.getCommentsByPost);
router.post('/:id/like', authMiddleware, commentController.likeComment);

export default router;
