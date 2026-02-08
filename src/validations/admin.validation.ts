import { z } from 'zod';

const allowedEmailDomains = [
  'gmail.com',
  'outlook.com',
  'proton.me',
  'yandex.ru',
  'qq.com',
  '163.com',
  '126.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'protonmail.com',
  'mail.ru',
  'student.ub.ac.id',
  'ub.ac.id',
];

export const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email().refine(
    (email) => {
      const domain = email.split('@')[1];
      return allowedEmailDomains.includes(domain);
    },
    {
      message: `Email domain not allowed. Allowed domains: ${allowedEmailDomains.join(', ')}`,
    }
  ),
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
  email: z
    .string()
    .email()
    .refine(
      (email) => {
        const domain = email.split('@')[1];
        return allowedEmailDomains.includes(domain);
      },
      {
        message: `Email domain not allowed. Allowed domains: ${allowedEmailDomains.join(', ')}`,
      }
    )
    .optional(),
  role: z.enum(['USER', 'CANTEEN_OWNER', 'ADMIN']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
