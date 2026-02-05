import { z } from 'zod';

export const createCanteenSchema = z.object({
  name: z
    .string()
    .min(3, 'Canteen name must be at least 3 characters')
    .max(100, 'Canteen name must not exceed 100 characters'),
});

export type CreateCanteenInput = z.infer<typeof createCanteenSchema>;

export const updateCanteenSchema = z.object({
  name: z
    .string()
    .min(3, 'Canteen name must be at least 3 characters')
    .max(100, 'Canteen name must not exceed 100 characters')
    .optional(),
  isOpen: z.boolean().optional(),
});

export type UpdateCanteenInput = z.infer<typeof updateCanteenSchema>;

export const createMenuItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Menu item name must be at least 2 characters')
    .max(100, 'Menu item name must not exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  price: z
    .number()
    .positive('Price must be greater than 0'),
  stock: z
    .number()
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative'),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Menu item name must be at least 2 characters')
    .max(100, 'Menu item name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .optional(),
  stock: z
    .number()
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative')
    .optional(),
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
