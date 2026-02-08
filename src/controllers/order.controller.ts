import { Request, Response } from 'express';
import { ZodError } from 'zod';
import orderService from '../services/order.service';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  makePaymentSchema,
  createReviewSchema,
  paginationSchema,
} from '../validations/order.validation';

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { canteenId } = req.params;
      const body = req.body;

      const validatedData = createOrderSchema.parse(body);
      const order = await orderService.createOrder(userId, canteenId as string, validatedData);

      res.status(201).json({
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof Error) {
        res.status(400).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { page, limit, status, paymentStatus } = paginationSchema.parse(req.query);
      const result = await orderService.getUserOrders(userId, page, limit, status, paymentStatus);

      res.status(200).json({
        message: 'Orders retrieved successfully',
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async getCanteenOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { canteenId } = req.params;

      const orders = await orderService.getCanteenOrders(canteenId as string, userId, role);

      res.status(200).json({
        message: 'Orders retrieved successfully',
        data: orders,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(403).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { orderId } = req.params;
      const body = req.body;

      const validatedData = updateOrderStatusSchema.parse(body);
      const order = await orderService.updateOrderStatus(orderId as string, userId, role, validatedData);

      res.status(200).json({
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof Error) {
        res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async makePayment(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { orderId } = req.params;
      const body = req.body;

      const validatedData = makePaymentSchema.parse(body);
      const result = await orderService.makePayment(orderId as string, userId, validatedData);

      res.status(200).json({
        message: 'Payment processed successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof Error) {
        res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { orderId } = req.params;
      const body = req.body;

      const validatedData = createReviewSchema.parse(body);
      const review = await orderService.createReview(orderId as string, userId, validatedData);

      res.status(201).json({
        message: 'Review created successfully',
        data: review,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof Error) {
        res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { reviewId } = req.params;

      const result = await orderService.deleteReview(reviewId as string, userId, role);

      res.status(200).json({
        message: result.message,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async getCanteenReviews(req: Request, res: Response): Promise<void> {
    try {
      const { canteenId } = req.params;

      const reviews = await orderService.getCanteenReviews(canteenId as string);

      res.status(200).json({
        message: 'Reviews retrieved successfully',
        data: reviews,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}

export default new OrderController();
