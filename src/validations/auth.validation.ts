import { z } from 'zod';

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  '163.com',
  'qq.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yandex.ru',
  'yahoo.com',
  '126.com',
  'proton.me',
  'protonmail.com',
  'mail.ru',
];

const isAllowedEmailDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .email('Invalid email format')
    .refine(isAllowedEmailDomain, {
      message: 'Email domain is not allowed. Please use an allowed email provider.',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
