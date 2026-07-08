import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { rateLimiterMiddleware } from '../../../app/middlewares/rate-limiter.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', rateLimiterMiddleware, authController.login);

export default router;
