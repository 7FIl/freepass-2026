import prisma from '../utils/prisma';
import cache, { CACHE_KEYS, CACHE_TTL } from '../utils/cache';
import {
  CreateCanteenInput,
  UpdateCanteenInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from '../validations/canteen.validation';
import { NotFoundError, ForbiddenError, BadRequestError } from '../types/errors';

export class CanteenService {
  async createCanteen(ownerId: string, data: CreateCanteenInput) {
    const canteen = await prisma.canteen.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    await cache.del(CACHE_KEYS.CANTEENS_LIST);

    return canteen;
  }

  async getCanteens() {
    return cache.getOrSet(
      CACHE_KEYS.CANTEENS_LIST,
      async () => {
        const canteens = await prisma.canteen.findMany({
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            menuItems: true,
          },
        });
        return canteens;
      },
      CACHE_TTL.CANTEENS,
    );
  }

  async getCanteenById(canteenId: string) {
    return cache.getOrSet(
      CACHE_KEYS.CANTEEN_BY_ID(canteenId),
      async () => {
        const canteen = await prisma.canteen.findUnique({
          where: { id: canteenId },
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            menuItems: true,
          },
        });

        if (!canteen) {
          throw new NotFoundError('Canteen not found');
        }

        return canteen;
      },
      CACHE_TTL.CANTEENS,
    );
  }

  async updateCanteen(canteenId: string, userId: string, userRole: string, data: UpdateCanteenInput) {
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { ownerId: true },
    });

    if (!canteen) {
      throw new NotFoundError('Canteen not found');
    }

    if (canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can update this canteen');
    }

    const updatedCanteen = await prisma.canteen.update({
      where: { id: canteenId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    await cache.del([CACHE_KEYS.CANTEENS_LIST, CACHE_KEYS.CANTEEN_BY_ID(canteenId)]);

    return updatedCanteen;
  }

  async createMenuItem(canteenId: string, userId: string, userRole: string, data: CreateMenuItemInput) {
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { ownerId: true },
    });

    if (!canteen) {
      throw new NotFoundError('Canteen not found');
    }

    if (canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can create menu items');
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        ...data,
        canteenId,
      },
    });

    await cache.del([
      CACHE_KEYS.MENU_ITEMS(canteenId),
      CACHE_KEYS.CANTEEN_BY_ID(canteenId),
      CACHE_KEYS.CANTEENS_LIST,
    ]);

    return menuItem;
  }

  async getMenuItems(canteenId: string) {
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
    });

    if (!canteen) {
      throw new NotFoundError('Canteen not found');
    }

    return cache.getOrSet(
      CACHE_KEYS.MENU_ITEMS(canteenId),
      async () => {
        const menuItems = await prisma.menuItem.findMany({
          where: { canteenId },
        });
        return menuItems;
      },
      CACHE_TTL.MENU_ITEMS,
    );
  }

  async updateMenuItem(
    menuItemId: string,
    canteenId: string,
    userId: string,
    userRole: string,
    data: UpdateMenuItemInput,
  ) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        canteen: {
          select: { ownerId: true },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundError('Menu item not found');
    }

    if (menuItem.canteenId !== canteenId) {
      throw new BadRequestError('Menu item does not belong to this canteen');
    }

    if (menuItem.canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can update menu items');
    }

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data,
    });

    await cache.del([
      CACHE_KEYS.MENU_ITEMS(canteenId),
      CACHE_KEYS.CANTEEN_BY_ID(canteenId),
      CACHE_KEYS.CANTEENS_LIST,
    ]);

    return updatedMenuItem;
  }

  async deleteMenuItem(menuItemId: string, canteenId: string, userId: string, userRole: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        canteen: {
          select: { ownerId: true },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundError('Menu item not found');
    }

    if (menuItem.canteenId !== canteenId) {
      throw new BadRequestError('Menu item does not belong to this canteen');
    }

    if (menuItem.canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can delete menu items');
    }

    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    await cache.del([
      CACHE_KEYS.MENU_ITEMS(canteenId),
      CACHE_KEYS.CANTEEN_BY_ID(canteenId),
      CACHE_KEYS.CANTEENS_LIST,
    ]);

    return { message: 'Menu item deleted successfully' };
  }
}

export default new CanteenService();
