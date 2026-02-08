import { Request, Response } from 'express';
import canteenService from '../services/canteen.service';
import {
  createCanteenSchema,
  updateCanteenSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from '../validations/canteen.validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../types/errors';

export class CanteenController {
  createCanteen = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createCanteenSchema.parse(req.body);

    if (req.user?.role !== 'CANTEEN_OWNER' && req.user?.role !== 'ADMIN') {
      throw new ForbiddenError('Forbidden: Only canteen owners and admins can create canteens');
    }

    const canteen = await canteenService.createCanteen(req.user.userId, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Canteen created successfully',
      data: canteen,
    });
  });

  getCanteens = asyncHandler(async (_req: Request, res: Response) => {
    const canteens = await canteenService.getCanteens();

    return res.status(200).json({
      success: true,
      message: 'Canteens retrieved successfully',
      data: canteens,
    });
  });

  getCanteenById = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId } = req.params;
    const canteen = await canteenService.getCanteenById(canteenId as string);

    return res.status(200).json({
      success: true,
      message: 'Canteen retrieved successfully',
      data: canteen,
    });
  });

  updateCanteen = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId } = req.params;
    const validatedData = updateCanteenSchema.parse(req.body);

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const updatedCanteen = await canteenService.updateCanteen(
      canteenId as string,
      req.user.userId,
      req.user.role,
      validatedData,
    );

    return res.status(200).json({
      success: true,
      message: 'Canteen updated successfully',
      data: updatedCanteen,
    });
  });

  createMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId } = req.params;
    const validatedData = createMenuItemSchema.parse(req.body);

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const menuItem = await canteenService.createMenuItem(
      canteenId as string,
      req.user.userId,
      req.user.role,
      validatedData,
    );

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem,
    });
  });

  getMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId } = req.params;
    const menuItems = await canteenService.getMenuItems(canteenId as string);

    return res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      data: menuItems,
    });
  });

  updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId, menuItemId } = req.params;
    const validatedData = updateMenuItemSchema.parse(req.body);

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const updatedMenuItem = await canteenService.updateMenuItem(
      menuItemId as string,
      canteenId as string,
      req.user.userId,
      req.user.role,
      validatedData,
    );

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem,
    });
  });

  deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { canteenId, menuItemId } = req.params;

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const result = await canteenService.deleteMenuItem(
      menuItemId as string,
      canteenId as string,
      req.user.userId,
      req.user.role,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  });
}

export default new CanteenController();
