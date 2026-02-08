import { Request, Response } from 'express';
import adminService from '../services/admin.service';
import {
  createUserSchema,
  updateUserSchema,
} from '../validations/admin.validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError } from '../types/errors';

export class AdminController {
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createUserSchema.parse(req.body);

    if (req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only admins can create users');
    }

    const user = await adminService.createUser(validatedData);

    return res.status(201).json({
      message: 'User created successfully',
      data: user,
    });
  });

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only admins can view all users');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await adminService.getAllUsers(page, limit);

    return res.status(200).json({
      message: 'Users retrieved successfully',
      data: result,
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only admins can view user details');
    }

    const { userId } = req.params;
    const user = await adminService.getUserById(userId as string);

    return res.status(200).json({
      message: 'User retrieved successfully',
      data: user,
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    if (req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only admins can update users');
    }

    const user = await adminService.updateUser(userId as string, validatedData);

    return res.status(200).json({
      message: 'User updated successfully',
      data: user,
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only admins can delete users');
    }

    const { userId } = req.params;
    const result = await adminService.deleteUser(userId as string);

    return res.status(200).json({
      message: result.message,
    });
  });

  getCanteenOwners = asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only admins can view canteen owners');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await adminService.getCanteenOwners(page, limit);

    return res.status(200).json({
      message: 'Canteen owners retrieved successfully',
      data: result,
    });
  });
}

export default new AdminController();
