import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { registrationLimiter, loginLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/register', registrationLimiter, authController.register.bind(authController));
router.post('/login', loginLimiter, authController.login.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));
router.put('/change-password', authenticate, authController.changePassword.bind(authController));

export default router;
