import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { registerSchema } from '../validations/auth.validation';
import { ZodError } from 'zod';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);

      const user = await authService.register(validatedData);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default new AuthController();
