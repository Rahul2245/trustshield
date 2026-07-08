import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { rateLimiterMiddleware } from '../../../app/middlewares/rate-limiter.middleware';
import { authMiddleware } from '../../../app/middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', rateLimiterMiddleware, authController.login);
router.get('/me', authMiddleware, authController.me);

export default router;
