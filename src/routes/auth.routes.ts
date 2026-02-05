import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { registrationLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/register', registrationLimiter, authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));

export default router;
