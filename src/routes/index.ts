import { Router } from 'express';
import authRoutes from './auth.routes';
import canteenRoutes from './canteen.routes';
import orderRoutes from './order.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/canteens', canteenRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

export default router;
