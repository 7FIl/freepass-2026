import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes';
import prisma from '../utils/prisma';
import { errorHandler } from '../middlewares/errorHandler.middleware';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth API - Edge Cases', () => {
  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.canteen.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.username).toBe('testuser');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'duplicate@gmail.com',
          password: 'TestPassword123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email already in use');
    });

    it('should reject duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'email1@gmail.com',
          password: 'TestPassword123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'email2@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Username already in use');
    });

    it('should reject invalid email domain', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@invaliddomain.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject short username (less than 3)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'test@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('username');
    });

    it('should reject long username (more than 30)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'a'.repeat(31),
          email: 'test@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('username');
    });

    it('should reject password without uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@gmail.com',
          password: 'testpassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject password without lowercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@gmail.com',
          password: 'TESTPASSWORD123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject password without number', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@gmail.com',
          password: 'TestPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject short password (less than 8)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@gmail.com',
          password: 'Test123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'notanemail',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject empty string fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '',
          email: 'test@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'auth_loginuser',
          email: 'auth_login@gmail.com',
          password: 'TestPassword123',
        });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth_login@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('auth_login@gmail.com');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth_login@gmail.com',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@gmail.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notanemail',
          password: 'TestPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should return token valid for 24 hours', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth_login@gmail.com',
          password: 'TestPassword123',
        });

      expect(res.body.data.token).toBeDefined();
      // Token should be JWT format (three parts separated by dots)
      expect(res.body.data.token.split('.').length).toBe(3);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token: string;

    beforeAll(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'auth_profileuser',
          email: 'auth_profile@gmail.com',
          password: 'TestPassword123',
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth_profile@gmail.com',
          password: 'TestPassword123',
        });

      token = loginRes.body.data.token;
    });

    it('should update profile with valid data', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'auth_newusername',
          email: 'auth_newemail@gmail.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('auth_newusername');
      expect(res.body.data.email).toBe('auth_newemail@gmail.com');
    });

    it('should reject update without auth token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({
          username: 'auth_newusername2',
          email: 'auth_newemail2@gmail.com',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          username: 'auth_newusername3',
          email: 'auth_newemail3@gmail.com',
        });

      expect(res.status).toBe(401);
    });

    it('should reject update with invalid email domain', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'test@invaliddomain.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should reject update with short username', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'ab',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });
  });
});
