import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../../../app/middlewares/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, userController.getMyProfile);
router.put('/me', authMiddleware, userController.updateProfile);
router.get('/:id', userController.getPublicProfile);

export default router;
