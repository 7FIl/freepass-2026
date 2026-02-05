import { Router } from 'express';
import canteenController from '../controllers/canteen.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, canteenController.createCanteen.bind(canteenController));
router.get('/', canteenController.getCanteens.bind(canteenController));
router.get('/:canteenId', canteenController.getCanteenById.bind(canteenController));
router.put('/:canteenId', authenticate, canteenController.updateCanteen.bind(canteenController));
router.post('/:canteenId/toggle-status', authenticate, canteenController.toggleCanteenStatus.bind(canteenController));

router.post('/:canteenId/menu', authenticate, canteenController.createMenuItem.bind(canteenController));
router.get('/:canteenId/menu', canteenController.getMenuItems.bind(canteenController));
router.put('/:canteenId/menu/:menuItemId', authenticate, canteenController.updateMenuItem.bind(canteenController));
router.delete('/:canteenId/menu/:menuItemId', authenticate, canteenController.deleteMenuItem.bind(canteenController));

export default router;
