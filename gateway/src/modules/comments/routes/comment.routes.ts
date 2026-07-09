import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';

const router = Router();

router.post('/', commentController.createComment);
router.get('/post/:postId', commentController.getCommentsByPost);

export default router;
