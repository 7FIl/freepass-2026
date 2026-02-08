import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/users', adminController.createUser.bind(adminController));
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserById.bind(adminController));
router.put('/users/:userId', adminController.updateUser.bind(adminController));
router.delete('/users/:userId', adminController.deleteUser.bind(adminController));

router.get('/canteen-owners', adminController.getCanteenOwners.bind(adminController));

export default router;
