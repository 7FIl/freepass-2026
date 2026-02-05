import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/users', (req, res) => adminController.createUser(req as any, res));
router.get('/users', (req, res) => adminController.getAllUsers(req as any, res));
router.get('/users/:userId', (req, res) => adminController.getUserById(req as any, res));
router.put('/users/:userId', (req, res) => adminController.updateUser(req as any, res));
router.delete('/users/:userId', (req, res) => adminController.deleteUser(req as any, res));

router.get('/canteen-owners', (req, res) => adminController.getCanteenOwners(req as any, res));

export default router;
