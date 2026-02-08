import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Custom key generator that combines IP with user identifier (email for auth routes)
 * This prevents users on shared IPs (public WiFi) from being affected by others' actions
 */
const createKeyGenerator = (identifierField: string) => (req: Request): string => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const identifier = req.body?.[identifierField] || '';
  
  // Combine IP + identifier for unique rate limiting per user per IP
  // This way, different users on the same IP won't affect each other
  return `${ip}:${identifier.toLowerCase()}`;
};

/**
 * Fallback key generator for authenticated routes - uses user ID if available
 */
export const createAuthenticatedKeyGenerator = () => (req: Request): string => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  
  // If user is authenticated, use their ID instead of just IP
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
  keyGenerator: createKeyGenerator('email'), // Rate limit per IP + email combination
  validate: { keyGeneratorIpFallback: false }, // We use custom key, not just IP
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 3,
  message: 'Too many login attempts, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator('email'), // Rate limit per IP + email combination
  validate: { keyGeneratorIpFallback: false }, // We use custom key, not just IP
});

/**
 * General API rate limiter for authenticated endpoints
 * Uses user ID when available, falls back to IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  message: 'Too many requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createAuthenticatedKeyGenerator(),
  validate: { keyGeneratorIpFallback: false }, // We use user ID when available, IP as fallback
});

/**
 * Rate limiter for order creation - stricter limit
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: 'Too many orders, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createAuthenticatedKeyGenerator(),
  validate: { keyGeneratorIpFallback: false },
});

/**
 * Rate limiter for review creation - prevent review spam
 */
export const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: 'Too many reviews, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createAuthenticatedKeyGenerator(),
  validate: { keyGeneratorIpFallback: false },
});

/**
 * Rate limiter for public GET endpoints (canteens, menus)
 * Uses IP only since these are unauthenticated
 */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 60,
  message: 'Too many requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});
