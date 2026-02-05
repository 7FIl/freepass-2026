import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, (req, res) => orderController.getUserOrders(req as any, res));
router.post('/:canteenId', authenticate, (req, res) => orderController.createOrder(req as any, res));
router.put('/:orderId/status', authenticate, (req, res) => orderController.updateOrderStatus(req as any, res));
router.post('/:orderId/payment', authenticate, (req, res) => orderController.makePayment(req as any, res));
router.post('/:orderId/review', authenticate, (req, res) => orderController.createReview(req as any, res));

router.get('/canteen/:canteenId', authenticate, (req, res) => orderController.getCanteenOrders(req as any, res));
router.get('/canteen/:canteenId/reviews', (req, res) => orderController.getCanteenReviews(req, res));

router.delete('/review/:reviewId', authenticate, (req, res) => orderController.deleteReview(req as any, res));

export default router;
