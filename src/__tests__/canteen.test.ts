import request from 'supertest';
import express from 'express';
import canteenRoutes from '../routes/canteen.routes';
import authRoutes from '../routes/auth.routes';
import prisma from '../utils/prisma';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/canteens', canteenRoutes);

describe('Canteen API - Edge Cases', () => {
  let ownerToken: string;
  let canteenId: string;
  let userToken: string;

  beforeAll(async () => {
    // Clean database
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.canteen.deleteMany();
    await prisma.user.deleteMany();

    // Create canteen owner account
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'canteenowner',
        email: 'owner@gmail.com',
        password: 'TestPassword123',
      });

    // Update role to CANTEEN_OWNER
    await prisma.user.update({
      where: { email: 'owner@gmail.com' },
      data: { role: 'CANTEEN_OWNER' },
    });

    const ownerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@gmail.com',
        password: 'TestPassword123',
      });
    ownerToken = ownerLoginRes.body.data.token;

    // Create regular user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'regularuser',
        email: 'user@gmail.com',
        password: 'TestPassword123',
      });

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@gmail.com',
        password: 'TestPassword123',
      });
    userToken = userLoginRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/canteens - Create Canteen', () => {
    it('should create canteen with valid data', async () => {
      const res = await request(app)
        .post('/api/canteens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'My Canteen',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('My Canteen');
      expect(res.body.data.isOpen).toBe(true);
      canteenId = res.body.data.id;
    });

    it('should reject canteen creation without auth', async () => {
      const res = await request(app)
        .post('/api/canteens')
        .send({
          name: 'Unauthorized Canteen',
        });

      expect(res.status).toBe(401);
    });

    it('should reject short canteen name (less than 3)', async () => {
      const res = await request(app)
        .post('/api/canteens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'ab',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject long canteen name (more than 100)', async () => {
      const res = await request(app)
        .post('/api/canteens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'a'.repeat(101),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/canteens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject missing name field', async () => {
      const res = await request(app)
        .post('/api/canteens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/canteens - List Canteens', () => {
    it('should get all canteens', async () => {
      const res = await request(app)
        .get('/api/canteens')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return canteens with pagination', async () => {
      const res = await request(app)
        .get('/api/canteens?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should get canteens without auth', async () => {
      const res = await request(app)
        .get('/api/canteens');

      expect([200, 401]).toContain(res.status);
    });
  });

  describe('GET /api/canteens/:canteenId - Get Single Canteen', () => {
    it('should get canteen details by id', async () => {
      const res = await request(app)
        .get(`/api/canteens/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(canteenId);
    });

    it('should reject invalid canteen id', async () => {
      const res = await request(app)
        .get('/api/canteens/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject non-existent canteen id', async () => {
      const res = await request(app)
        .get('/api/canteens/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/canteens/:canteenId - Update Canteen', () => {
    it('should update canteen as owner', async () => {
      const res = await request(app)
        .put(`/api/canteens/${canteenId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Updated Canteen Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Canteen Name');
    });

    it('should reject update by non-owner', async () => {
      const res = await request(app)
        .put(`/api/canteens/${canteenId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject update without auth', async () => {
      const res = await request(app)
        .put(`/api/canteens/${canteenId}`)
        .send({
          name: 'No Auth Name',
        });

      expect(res.status).toBe(401);
    });

    it('should reject update with invalid name', async () => {
      const res = await request(app)
        .put(`/api/canteens/${canteenId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'a',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/canteens/:canteenId/toggle-status - Toggle Status', () => {
    it('should toggle canteen status from open to closed', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/toggle-status`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOpen).toBe(false);
    });

    it('should toggle canteen status from closed to open', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/toggle-status`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOpen).toBe(true);
    });

    it('should reject toggle by non-owner', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/toggle-status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject toggle without auth', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/toggle-status`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/canteens/:canteenId/menu - Create Menu Item', () => {
    it('should create menu item with valid data', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Burger',
          description: 'Delicious burger with cheese',
          price: 5.99,
          stock: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Burger');
      expect(res.body.data.price).toBe(5.99);
      expect(res.body.data.stock).toBe(50);
    });

    it('should reject short menu item name (less than 2)', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'B',
          description: 'Delicious burger',
          price: 5.99,
          stock: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject short description (less than 10)', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Burger',
          description: 'Short',
          price: 5.99,
          stock: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject negative price', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Burger',
          description: 'Delicious burger',
          price: -5.99,
          stock: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject negative stock', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Burger',
          description: 'Delicious burger',
          price: 5.99,
          stock: -10,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject creation by non-owner', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacked Item',
          description: 'Should not work here',
          price: 999,
          stock: 999,
        });

      expect(res.status).toBe(403);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Burger',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/canteens/:canteenId/menu - List Menu Items', () => {
    it('should get menu items for canteen', async () => {
      const res = await request(app)
        .get(`/api/canteens/${canteenId}/menu`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject invalid canteen id', async () => {
      const res = await request(app)
        .get('/api/canteens/invalid-id/menu')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });
});
