import rateLimit from 'express-rate-limit';

export const registrationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: 'Too many registration attempts from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});
