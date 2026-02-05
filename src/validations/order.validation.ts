import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid('Invalid menu item ID'),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .positive('Quantity must be greater than 0'),
      }),
    )
    .min(1, 'At least one item must be ordered'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['WAITING', 'COOKING', 'READY', 'COMPLETED'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const makePaymentSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
});

export type MakePaymentInput = z.infer<typeof makePaymentSchema>;

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must not exceed 500 characters'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
