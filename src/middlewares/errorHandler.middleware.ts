import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
      });
    }
    
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided',
    });
  }

  // Handle validation errors (Zod)
  // Check for Zod errors by looking for 'issues' property
  if ('issues' in err || err.name === 'ZodError' || err instanceof ZodError) {
    const zodErr = err as any;
    const issues = zodErr.issues || zodErr.errors || [];
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  logger.error({ err, stack: err.stack }, 'Unexpected error');

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};
