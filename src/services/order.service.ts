import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  MakePaymentInput,
  CreateReviewInput,
} from '../validations/order.validation';
import { NotFoundError, ForbiddenError, BadRequestError } from '../types/errors';

export class OrderService {
  async createOrder(userId: string, canteenId: string, data: CreateOrderInput) {
    const order = await prisma.$transaction(async (tx) => {
      const canteen = await tx.canteen.findUnique({
        where: { id: canteenId },
      });

      if (!canteen) {
        throw new BadRequestError('Canteen not found');
      }

      if (!canteen.isOpen) {
        throw new BadRequestError('Canteen is currently closed');
      }

      const menuItemIds = data.items.map((item) => item.menuItemId);
      const menuItemsFromDb = await tx.menuItem.findMany({
        where: { id: { in: menuItemIds } },
      });

      const menuItemMap = new Map(menuItemsFromDb.map((m) => [m.id, m]));

      let totalPrice = new Prisma.Decimal(0);
      const menuItems: { id: string; price: Prisma.Decimal; name: string; stock: number }[] = [];

      for (const item of data.items) {
        const menuItem = menuItemMap.get(item.menuItemId);

        if (!menuItem) {
          throw new BadRequestError(`Menu item ${item.menuItemId} not found`);
        }

        if (menuItem.canteenId !== canteenId) {
          throw new BadRequestError(`Menu item ${item.menuItemId} does not belong to this canteen`);
        }

        if (menuItem.stock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for ${menuItem.name}. Available: ${menuItem.stock}`);
        }

        totalPrice = totalPrice.add(menuItem.price.mul(item.quantity));
        menuItems.push({
          id: menuItem.id,
          price: menuItem.price,
          name: menuItem.name,
          stock: menuItem.stock,
        });
      }

      for (const item of data.items) {
        const result = await tx.menuItem.updateMany({
          where: {
            id: item.menuItemId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new BadRequestError(`Insufficient stock for item. Please try again.`);
        }
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          canteenId,
          totalPrice,
          items: {
            create: data.items.map((item) => {
              const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: menuItem.price.mul(item.quantity),
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          canteen: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newOrder;
    });

    return order;
  }

  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: 'WAITING' | 'COOKING' | 'READY' | 'COMPLETED',
    paymentStatus?: 'UNPAID' | 'PAID'
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
    if (status) {
      whereClause.status = status;
    }
    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          canteen: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      orders,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getCanteenOrders(canteenId: string, userId: string, userRole: string) {
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { ownerId: true },
    });

    if (!canteen) {
      throw new NotFoundError('Canteen not found');
    }

    if (canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can view orders');
    }

    const orders = await prisma.order.findMany({
      where: { canteenId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        payments: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async updateOrderStatus(orderId: string, userId: string, userRole: string, data: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        canteen: {
          select: { ownerId: true },
        },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can update order status');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestError('Cannot update status: Order payment is not completed');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        canteen: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: true,
      },
    });

    return updatedOrder;
  }

  async makePayment(orderId: string, userId: string, data: MakePaymentInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('Unauthorized: You can only pay for your own orders');
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestError('Order has already been paid');
    }

    const amountDecimal = new Prisma.Decimal(data.amount);
    if (!amountDecimal.eq(order.totalPrice)) {
      throw new BadRequestError(`Amount mismatch. Expected: ${order.totalPrice.toString()}, Received: ${data.amount}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          paymentStatus: 'UNPAID',
        },
        data: {
          paymentStatus: 'PAID',
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestError('Order has already been paid');
      }

      const payment = await tx.payment.create({
        data: {
          orderId,
          amount: data.amount,
          status: 'PAID',
        },
      });

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          canteen: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: true,
        },
      });

      return { payment, order: updatedOrder };
    });

    return result;
  }

  async createReview(orderId: string, userId: string, data: CreateReviewInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        review: true,
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('Unauthorized: You can only review your own orders');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestError('You can only review completed orders');
    }

    if (order.review) {
      throw new BadRequestError('You have already reviewed this order');
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        userId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return review;
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        order: {
          include: {
            canteen: {
              select: { ownerId: true },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.order.canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized: Only the canteen owner or admin can delete reviews');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }

  async getCanteenReviews(canteenId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        order: {
          canteenId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }
}

export default new OrderService();
