import { Response } from 'express';
import { ZodError } from 'zod';
import canteenService from '../services/canteen.service';
import {
  createCanteenSchema,
  updateCanteenSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from '../validations/canteen.validation';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CanteenController {
  async createCanteen(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'CANTEEN_OWNER' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only canteen owners and admins can create canteens',
        });
      }

      const validatedData = createCanteenSchema.parse(req.body);
      const canteen = await canteenService.createCanteen(req.user.userId, validatedData);

      return res.status(201).json({
        success: true,
        message: 'Canteen created successfully',
        data: canteen,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
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

  async getCanteens(_req: AuthRequest, res: Response) {
    try {
      const canteens = await canteenService.getCanteens();

      return res.status(200).json({
        success: true,
        message: 'Canteens retrieved successfully',
        data: canteens,
      });
    } catch (error) {
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

  async getCanteenById(req: AuthRequest, res: Response) {
    try {
      const { canteenId } = req.params;
      const canteen = await canteenService.getCanteenById(canteenId);

      return res.status(200).json({
        success: true,
        message: 'Canteen retrieved successfully',
        data: canteen,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({
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

  async updateCanteen(req: AuthRequest, res: Response) {
    try {
      const { canteenId } = req.params;
      const validatedData = updateCanteenSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const updatedCanteen = await canteenService.updateCanteen(
        canteenId,
        req.user.userId,
        req.user.role,
        validatedData,
      );

      return res.status(200).json({
        success: true,
        message: 'Canteen updated successfully',
        data: updatedCanteen,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
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

  async createMenuItem(req: AuthRequest, res: Response) {
    try {
      const { canteenId } = req.params;
      const validatedData = createMenuItemSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const menuItem = await canteenService.createMenuItem(
        canteenId,
        req.user.userId,
        req.user.role,
        validatedData,
      );

      return res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: menuItem,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
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

  async getMenuItems(req: AuthRequest, res: Response) {
    try {
      const { canteenId } = req.params;
      const menuItems = await canteenService.getMenuItems(canteenId);

      return res.status(200).json({
        success: true,
        message: 'Menu items retrieved successfully',
        data: menuItems,
      });
    } catch (error) {
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

  async updateMenuItem(req: AuthRequest, res: Response) {
    try {
      const { canteenId, menuItemId } = req.params;
      const validatedData = updateMenuItemSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const updatedMenuItem = await canteenService.updateMenuItem(
        menuItemId,
        canteenId,
        req.user.userId,
        req.user.role,
        validatedData,
      );

      return res.status(200).json({
        success: true,
        message: 'Menu item updated successfully',
        data: updatedMenuItem,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
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

  async deleteMenuItem(req: AuthRequest, res: Response) {
    try {
      const { canteenId, menuItemId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await canteenService.deleteMenuItem(
        menuItemId,
        canteenId,
        req.user.userId,
        req.user.role,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
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

export default new CanteenController();
