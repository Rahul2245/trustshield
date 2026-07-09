import { Router } from 'express';
import { postController } from '../controllers/post.controller';

const router = Router();

// In a real scenario, an auth middleware should protect these routes
router.post('/', postController.createPost);
router.get('/', postController.getPosts);

export default router;
