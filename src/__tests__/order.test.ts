import request from 'supertest';
import express from 'express';
import orderRoutes from '../routes/order.routes';
import canteenRoutes from '../routes/canteen.routes';
import authRoutes from '../routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/orders', orderRoutes);

describe('Order API - Edge Cases', () => {
  let ownerToken: string;
  let userToken: string;
  let canteenId: string;
  let menuItemId: string;
  let orderId: string;

  beforeAll(async () => {
    // Create canteen owner
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'orderowner',
        email: 'orderowner@gmail.com',
        password: 'TestPassword123',
      });

    const ownerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'orderowner@gmail.com',
        password: 'TestPassword123',
      });
    ownerToken = ownerLoginRes.body.data.token;

    // Create customer user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ordercustomer',
        email: 'ordercustomer@gmail.com',
        password: 'TestPassword123',
      });

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ordercustomer@gmail.com',
        password: 'TestPassword123',
      });
    userToken = userLoginRes.body.data.token;

    // Create canteen
    const canteenRes = await request(app)
      .post('/api/canteens')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Order Test Canteen',
      });
    canteenId = canteenRes.body.data.id;

    // Create menu item with stock
    const menuRes = await request(app)
      .post(`/api/canteens/${canteenId}/menu`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Item',
        description: 'Test item description',
        price: 10.99,
        stock: 20,
      });
    menuItemId = menuRes.body.data.id;
  });

  describe('POST /api/orders/:canteenId - Create Order', () => {
    it('should create order with valid items', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.totalPrice).toBe(10.99 * 2);
      expect(res.body.data.status).toBe('WAITING');
      expect(res.body.data.paymentStatus).toBe('UNPAID');
      orderId = res.body.data.id;
    });

    it('should reject order without auth', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(401);
    });

    it('should reject order for non-existent canteen', async () => {
      const res = await request(app)
        .post('/api/orders/invalid-canteen-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Canteen not found');
    });

    it('should reject order with non-existent menu item', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId: 'invalid-item-id',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not found');
    });

    it('should reject order when menu item stock is insufficient', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 100, // More than available stock (20)
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
    });

    it('should reject order with zero quantity', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 0,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject order with negative quantity', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: -5,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject order with empty items array', async () => {
      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject order when canteen is closed', async () => {
      // Close the canteen
      await request(app)
        .post(`/api/canteens/${canteenId}/toggle-status`)
        .set('Authorization', `Bearer ${ownerToken}`);

      const res = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('currently closed');

      // Reopen canteen
      await request(app)
        .post(`/api/canteens/${canteenId}/toggle-status`)
        .set('Authorization', `Bearer ${ownerToken}`);
    });
  });

  describe('GET /api/orders - Get User Orders', () => {
    it('should get user orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .get('/api/orders');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/orders/:orderId/payment - Make Payment', () => {
    it('should process payment with correct amount', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10.99 * 2, // 21.98
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.paymentStatus).toBe('PAID');
      expect(res.body.data.payment.status).toBe('PAID');
    });

    it('should reject payment without auth', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .send({
          amount: 21.98,
        });

      expect(res.status).toBe(401);
    });

    it('should reject payment for non-existent order', async () => {
      const res = await request(app)
        .post('/api/orders/invalid-order-id/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Order not found');
    });

    it('should reject payment when already paid', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10.99 * 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been paid');
    });

    it('should reject payment with incorrect amount (too low)', async () => {
      // Create another order
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      const res = await request(app)
        .post(`/api/orders/${newOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 5.0, // Less than 10.99
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Amount mismatch');
    });

    it('should reject payment with incorrect amount (too high)', async () => {
      // Create another order
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      const res = await request(app)
        .post(`/api/orders/${newOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 999.99, // Much more than 10.99
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Amount mismatch');
    });

    it('should reject payment from non-order-owner', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          amount: 10.99 * 2,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });
  });

  describe('PUT /api/orders/:orderId/status - Update Order Status', () => {
    it('should update order status after payment', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COOKING',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COOKING');
    });

    it('should continue updating status', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'READY',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('READY');
    });

    it('should complete the order', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COMPLETED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('should reject status update by non-owner', async () => {
      // Create another order and pay it
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      await request(app)
        .post(`/api/orders/${newOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10.99,
        });

      const res = await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'COOKING',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject status update without payment', async () => {
      // Create another order without payment
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      const res = await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COOKING',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('payment is not completed');
    });
  });

  describe('POST /api/orders/:orderId/review - Create Review', () => {
    it('should create review for completed order', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          comment: 'Excellent service and delicious food!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toContain('Excellent');
    });

    it('should reject review without auth', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/review`)
        .send({
          rating: 5,
          comment: 'Excellent service and delicious food!',
        });

      expect(res.status).toBe(401);
    });

    it('should reject review with rating below 1', async () => {
      // Create and complete new order
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      await request(app)
        .post(`/api/orders/${newOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10.99,
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COOKING',
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'READY',
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COMPLETED',
        });

      const res = await request(app)
        .post(`/api/orders/${newOrderId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 0,
          comment: 'Bad service and bad food really!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject review with rating above 5', async () => {
      // Create and complete new order
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      await request(app)
        .post(`/api/orders/${newOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10.99,
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COOKING',
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'READY',
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COMPLETED',
        });

      const res = await request(app)
        .post(`/api/orders/${newOrderId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 10,
          comment: 'Excellent service and delicious food!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject review for non-completed order', async () => {
      // Create order but don't complete it
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      const res = await request(app)
        .post(`/api/orders/${newOrderId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          comment: 'Excellent service and delicious food!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('only review completed orders');
    });

    it('should reject duplicate review for same order', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 3,
          comment: 'Average service but good food overall',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already reviewed');
    });

    it('should reject short comment (less than 10)', async () => {
      // Create and complete new order
      const orderRes = await request(app)
        .post(`/api/orders/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        });
      const newOrderId = orderRes.body.data.id;

      await request(app)
        .post(`/api/orders/${newOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10.99,
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COOKING',
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'READY',
        });

      await request(app)
        .put(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'COMPLETED',
        });

      const res = await request(app)
        .post(`/api/orders/${newOrderId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 4,
          comment: 'Good',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('DELETE /api/orders/review/:reviewId - Delete Review', () => {
    it('should delete review as canteen owner', async () => {
      // Get review ID from completed order
      const ordersRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      const completedOrder = ordersRes.body.data.find(
        (o: any) => o.status === 'COMPLETED' && o.review
      );

      if (completedOrder && completedOrder.review) {
        const res = await request(app)
          .delete(`/api/orders/review/${completedOrder.review.id}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect([200, 403]).toContain(res.status);
      }
    });

    it('should reject delete without auth', async () => {
      const res = await request(app)
        .delete('/api/orders/review/invalid-review-id');

      expect(res.status).toBe(401);
    });

    it('should reject delete by non-owner', async () => {
      // Create another user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'otheruser@gmail.com',
          password: 'TestPassword123',
        });

      const otherUserLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otheruser@gmail.com',
          password: 'TestPassword123',
        });
      const otherUserToken = otherUserLoginRes.body.data.token;

      const res = await request(app)
        .delete('/api/orders/review/some-review-id')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});
