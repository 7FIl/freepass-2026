import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const createKeyGenerator = (identifierField: string) => (req: Request): string => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const identifier = req.body?.[identifierField] || '';
  return `${ip}:${identifier.toLowerCase()}`;
};

export const createAuthenticatedKeyGenerator = () => (req: Request): string => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }
  return ip;
};

export const registrationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: 'Too many registration attempts, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator('email'),
  validate: { keyGeneratorIpFallback: false },
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 3,
  message: 'Too many login attempts, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator('email'),
  validate: { keyGeneratorIpFallback: false },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  message: 'Too many requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createAuthenticatedKeyGenerator(),
  validate: { keyGeneratorIpFallback: false },
});

export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: 'Too many orders, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createAuthenticatedKeyGenerator(),
  validate: { keyGeneratorIpFallback: false },
});

export const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: 'Too many reviews, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createAuthenticatedKeyGenerator(),
  validate: { keyGeneratorIpFallback: false },
});

export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 60,
  message: 'Too many requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

