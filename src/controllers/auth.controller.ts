import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validations/auth.validation';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../types/errors';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.register(validatedData);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = updateProfileSchema.parse(req.body);

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const updatedUser = await authService.updateProfile(req.user.userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = changePasswordSchema.parse(req.body);

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const result = await authService.changePassword(req.user.userId, validatedData);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  });
}

export default new AuthController();
