import { Request, Response } from 'express';
import { ZodError } from 'zod';
import adminService from '../services/admin.service';
import {
  createUserSchema,
  updateUserSchema,
} from '../validations/admin.validation';

export class AdminController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const validatedData = createUserSchema.parse(body);

      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          message: 'Unauthorized: Only admins can create users',
        });
        return;
      }

      const user = await adminService.createUser(validatedData);

      res.status(201).json({
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof Error) {
        res.status(400).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          message: 'Unauthorized: Only admins can view all users',
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await adminService.getAllUsers(page, limit);

      res.status(200).json({
        message: 'Users retrieved successfully',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          message: 'Unauthorized: Only admins can view user details',
        });
        return;
      }

      const { userId } = req.params;
      const user = await adminService.getUserById(userId as string);

      res.status(200).json({
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const body = req.body;
      const validatedData = updateUserSchema.parse(body);

      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          message: 'Unauthorized: Only admins can update users',
        });
        return;
      }

      const user = await adminService.updateUser(userId as string, validatedData);

      res.status(200).json({
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof Error) {
        res.status(error.message.includes('not found') ? 404 : 400).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          message: 'Unauthorized: Only admins can delete users',
        });
        return;
      }

      const { userId } = req.params;
      const result = await adminService.deleteUser(userId as string);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  async getCanteenOwners(req: Request, res: Response): Promise<void> {
    try {
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          message: 'Unauthorized: Only admins can view canteen owners',
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await adminService.getCanteenOwners(page, limit);

      res.status(200).json({
        message: 'Canteen owners retrieved successfully',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}

export default new AdminController();
