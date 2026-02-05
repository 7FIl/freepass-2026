import { Router } from 'express';
import authRoutes from './auth.routes';
import canteenRoutes from './canteen.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/canteens', canteenRoutes);

export default router;
