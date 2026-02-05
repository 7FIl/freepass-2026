import prisma from '../utils/prisma';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  MakePaymentInput,
  CreateReviewInput,
} from '../validations/order.validation';

export class OrderService {
  async createOrder(userId: string, canteenId: string, data: CreateOrderInput) {
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
    });

    if (!canteen) {
      throw new Error('Canteen not found');
    }

    if (!canteen.isOpen) {
      throw new Error('Canteen is currently closed');
    }

    // Validate all items and calculate total price
    let totalPrice = 0;
    const menuItems: { id: string; price: number; name: string; stock: number }[] = [];

    for (const item of data.items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }

      if (menuItem.canteenId !== canteenId) {
        throw new Error(`Menu item ${item.menuItemId} does not belong to this canteen`);
      }

      if (menuItem.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${menuItem.name}. Available: ${menuItem.stock}`);
      }

      totalPrice += menuItem.price * item.quantity;
      menuItems.push({
        id: menuItem.id,
        price: menuItem.price,
        name: menuItem.name,
        stock: menuItem.stock,
      });
    }

    // Create order with items
    const order = await prisma.order.create({
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
              price: menuItem.price * item.quantity,
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

    // Decrease stock for each item
    for (const item of data.items) {
      await prisma.menuItem.update({
        where: { id: item.menuItemId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  }

  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
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
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async getCanteenOrders(canteenId: string, userId: string, userRole: string) {
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { ownerId: true },
    });

    if (!canteen) {
      throw new Error('Canteen not found');
    }

    if (canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized: Only the canteen owner or admin can view orders');
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
        payment: true,
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
      throw new Error('Order not found');
    }

    if (order.canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized: Only the canteen owner or admin can update order status');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new Error('Cannot update status: Order payment is not completed');
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
        payment: true,
      },
    });

    return updatedOrder;
  }

  async makePayment(orderId: string, userId: string, data: MakePaymentInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: You can only pay for your own orders');
    }

    if (order.paymentStatus === 'PAID') {
      throw new Error('Order has already been paid');
    }

    if (Math.abs(data.amount - order.totalPrice) > 0.01) {
      throw new Error(`Amount mismatch. Expected: ${order.totalPrice}, Received: ${data.amount}`);
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: data.amount,
        status: 'PAID',
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
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
        payment: true,
      },
    });

    return { payment, order: updatedOrder };
  }

  async createReview(orderId: string, userId: string, data: CreateReviewInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: You can only review your own orders');
    }

    if (order.status !== 'COMPLETED') {
      throw new Error('You can only review completed orders');
    }

    if (order.review) {
      throw new Error('You have already reviewed this order');
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
      throw new Error('Review not found');
    }

    if (review.order.canteen.ownerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized: Only the canteen owner or admin can delete reviews');
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
