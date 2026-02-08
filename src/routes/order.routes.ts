import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { orderLimiter, reviewLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.get('/', authenticate, orderController.getUserOrders.bind(orderController));
router.post('/:canteenId', authenticate, orderLimiter, orderController.createOrder.bind(orderController));
router.put('/:orderId/status', authenticate, orderController.updateOrderStatus.bind(orderController));
router.post('/:orderId/payment', authenticate, orderController.makePayment.bind(orderController));
router.post('/:orderId/review', authenticate, reviewLimiter, orderController.createReview.bind(orderController));

router.get('/canteen/:canteenId', authenticate, orderController.getCanteenOrders.bind(orderController));
router.get('/canteen/:canteenId/reviews', orderController.getCanteenReviews.bind(orderController));

router.delete('/review/:reviewId', authenticate, orderController.deleteReview.bind(orderController));

export default router;
