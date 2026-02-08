import { z } from 'zod';

// Note: Email domain validation is now done dynamically via database
// The schemas below don't include domain validation - it's handled in the service layer

export const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((pwd) => /[A-Z]/.test(pwd), 'Password must contain uppercase letter')
    .refine((pwd) => /[a-z]/.test(pwd), 'Password must contain lowercase letter')
    .refine((pwd) => /[0-9]/.test(pwd), 'Password must contain number'),
  role: z.enum(['USER', 'CANTEEN_OWNER', 'ADMIN']),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['USER', 'CANTEEN_OWNER', 'ADMIN']).optional(),
});

export const addDomainSchema = z.object({
  domain: z
    .string()
    .min(3, 'Domain must be at least 3 characters')
    .max(253, 'Domain must not exceed 253 characters')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/,
      'Invalid domain format (e.g., example.com)'
    ),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AddDomainInput = z.infer<typeof addDomainSchema>;
