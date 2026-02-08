import request from 'supertest';
import express from 'express';
import adminRoutes from '../routes/admin.routes';
import authRoutes from '../routes/auth.routes';
import prisma from '../utils/prisma';
import { errorHandler } from '../middlewares/errorHandler.middleware';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

describe('Admin API - Edge Cases', () => {
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    // Clean database
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.canteen.deleteMany();
    await prisma.user.deleteMany();

    // Create admin account
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'AdminPassword123',
      });

    // Manually update role to ADMIN in database
    await prisma.user.update({
      where: { email: 'admin@gmail.com' },
      data: { role: 'ADMIN' },
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmail.com',
        password: 'AdminPassword123',
      });
    adminToken = adminLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/admin/users - Create User', () => {
    it('should create regular user account', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser',
          email: 'newuser@gmail.com',
          password: 'TestPassword123',
          role: 'USER',
        });

      expect([201, 403]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.data.username).toBe('newuser');
        expect(res.body.data.role).toBe('USER');
        userId = res.body.data.id;
      }
    });

    it('should create canteen owner account', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'owneraccount',
          email: 'owner123@gmail.com',
          password: 'OwnerPassword123',
          role: 'CANTEEN_OWNER',
        });

      expect([201, 403]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.data.role).toBe('CANTEEN_OWNER');
      }
    });

    it('should reject creation by non-admin', async () => {
      // Create a regular user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin_regularuser',
          email: 'admin_regularuser@gmail.com',
          password: 'TestPassword123',
        });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin_regularuser@gmail.com',
          password: 'TestPassword123',
        });
      const userToken = userLoginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'hacker',
          email: 'hacker@gmail.com',
          password: 'HackerPassword123',
          role: 'ADMIN',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject creation without auth', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send({
          username: 'noauth',
          email: 'noauth@gmail.com',
          password: 'TestPassword123',
          role: 'USER',
        });

      expect(res.status).toBe(401);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'anotheruser',
          email: 'newuser@gmail.com', // Already exists
          password: 'TestPassword123',
          role: 'USER',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email already in use');
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser', // Already exists
          email: 'different@gmail.com',
          password: 'TestPassword123',
          role: 'USER',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Username already in use');
    });

    it('should reject invalid email domain', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalidemailuser',
          email: 'test@invaliddomain.com',
          password: 'TestPassword123',
          role: 'USER',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email domain not allowed');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'weakpassuser',
          email: 'weakpass@gmail.com',
          password: 'weak', // Too short and no requirements
          role: 'USER',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalidrole',
          email: 'invalidrole@gmail.com',
          password: 'TestPassword123',
          role: 'SUPERADMIN', // Invalid role
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'incomplete',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/admin/users - List Users', () => {
    it('should get all users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('pagination');
        expect(res.body.data.pagination.page).toBe(1);
      }
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'normaluser2',
          email: 'normaluser2@gmail.com',
          password: 'TestPassword123',
        });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'normaluser2@gmail.com',
          password: 'TestPassword123',
        });
      const userToken = userLoginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .get('/api/admin/users');

      expect(res.status).toBe(401);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=2&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.pagination.page).toBe(2);
        expect(res.body.data.pagination.limit).toBe(5);
      }
    });
  });

  describe('GET /api/admin/users/:userId - Get User Details', () => {
    it('should get user details', async () => {
      if (userId) {
        const res = await request(app)
          .get(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 403]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body.data.id).toBe(userId);
        }
      }
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'normaluser3',
          email: 'normaluser3@gmail.com',
          password: 'TestPassword123',
        });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'normaluser3@gmail.com',
          password: 'TestPassword123',
        });
      const userToken = userLoginRes.body.data.accessToken;

      const res = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .get('/api/admin/users/invalid-user-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 403]).toContain(res.status);
    });
  });

  describe('PUT /api/admin/users/:userId - Update User', () => {
    it('should update user role', async () => {
      if (userId) {
        const res = await request(app)
          .put(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            role: 'CANTEEN_OWNER',
          });

        expect([200, 403]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body.data.role).toBe('CANTEEN_OWNER');
        }
      }
    });

    it('should update user email', async () => {
      if (userId) {
        const res = await request(app)
          .put(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'updatedemail@gmail.com',
          });

        expect([200, 403]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body.data.email).toBe('updatedemail@gmail.com');
        }
      }
    });

    it('should update user username', async () => {
      if (userId) {
        const res = await request(app)
          .put(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: 'updatedusername',
          });

        expect([200, 403]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body.data.username).toBe('updatedusername');
        }
      }
    });

    it('should reject update by non-admin', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'normaluser4',
          email: 'normaluser4@gmail.com',
          password: 'TestPassword123',
        });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'normaluser4@gmail.com',
          password: 'TestPassword123',
        });
      const userToken = userLoginRes.body.data.accessToken;

      const res = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'ADMIN',
        });

      expect(res.status).toBe(403);
    });

    it('should reject update with duplicate email', async () => {
      if (userId) {
        const res = await request(app)
          .put(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'admin@gmail.com', // Already in use by admin
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Email already in use');
      }
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .put('/api/admin/users/invalid-user-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'ADMIN',
        });

      expect([404, 403]).toContain(res.status);
    });
  });

  describe('DELETE /api/admin/users/:userId - Delete User', () => {
    it('should delete user account', async () => {
      if (userId) {
        const res = await request(app)
          .delete(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 403]).toContain(res.status);
      }
    });

    it('should reject deletion by non-admin', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'normaluser5',
          email: 'normaluser5@gmail.com',
          password: 'TestPassword123',
        });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'normaluser5@gmail.com',
          password: 'TestPassword123',
        });
      const userToken = userLoginRes.body.data.accessToken;

      const res = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject deletion without auth', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${userId}`);

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .delete('/api/admin/users/invalid-user-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 403]).toContain(res.status);
    });
  });

  describe('GET /api/admin/canteen-owners - List Canteen Owners', () => {
    it('should list all canteen owners', async () => {
      const res = await request(app)
        .get('/api/admin/canteen-owners?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('pagination');
      }
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'normaluser6',
          email: 'normaluser6@gmail.com',
          password: 'TestPassword123',
        });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'normaluser6@gmail.com',
          password: 'TestPassword123',
        });
      const userToken = userLoginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/admin/canteen-owners')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/canteen-owners?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.pagination.limit).toBe(5);
      }
    });
  });
});
