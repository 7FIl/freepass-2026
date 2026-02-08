import { Request, Response } from 'express';
import orderService from '../services/order.service';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  makePaymentSchema,
  createReviewSchema,
  paginationSchema,
} from '../validations/order.validation';
import { asyncHandler } from '../utils/asyncHandler';

export class OrderController {
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user!;
    const { canteenId } = req.params;

    const validatedData = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(userId, canteenId as string, validatedData);

    res.status(201).json({
      message: 'Order created successfully',
      data: order,
    });
  });

  getUserOrders = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user!;
    const { page, limit, status, paymentStatus } = paginationSchema.parse(req.query);
    const result = await orderService.getUserOrders(userId, page, limit, status, paymentStatus);

    res.status(200).json({
      message: 'Orders retrieved successfully',
      data: result.orders,
      pagination: result.pagination,
    });
  });

  getCanteenOrders = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const { canteenId } = req.params;

    const orders = await orderService.getCanteenOrders(canteenId as string, userId, role);

    res.status(200).json({
      message: 'Orders retrieved successfully',
      data: orders,
    });
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const { orderId } = req.params;

    const validatedData = updateOrderStatusSchema.parse(req.body);
    const order = await orderService.updateOrderStatus(orderId as string, userId, role, validatedData);

    res.status(200).json({
      message: 'Order status updated successfully',
      data: order,
    });
  });

  makePayment = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user!;
    const { orderId } = req.params;

    const validatedData = makePaymentSchema.parse(req.body);
    const result = await orderService.makePayment(orderId as string, userId, validatedData);

    res.status(200).json({
      message: 'Payment processed successfully',
      data: result,
    });
  });

  createReview = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user!;
    const { orderId } = req.params;

    const validatedData = createReviewSchema.parse(req.body);
    const review = await orderService.createReview(orderId as string, userId, validatedData);

    res.status(201).json({
      message: 'Review created successfully',
      data: review,
    });
  });

  deleteReview = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const { reviewId } = req.params;

    const result = await orderService.deleteReview(reviewId as string, userId, role);

    res.status(200).json({
      message: result.message,
    });
  });

  getCanteenReviews = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId } = req.params;

    const reviews = await orderService.getCanteenReviews(canteenId as string);

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      data: reviews,
    });
  });
}

export default new OrderController();
