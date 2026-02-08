import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput, RefreshTokenInput } from '../validations/auth.validation';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../types/errors';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Long-lived refresh token

export class AuthService {
  /**
   * Generate a secure random refresh token
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Create and store a new refresh token for a user
   */
  private async createRefreshToken(userId: string): Promise<string> {
    const token = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Generate access token (JWT)
   */
  private generateAccessToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );
  }

  async register(data: RegisterInput) {
    const { username, email, password } = data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestError('Email already in use');
      }
      if (existingUser.username === username) {
        throw new BadRequestError('Username already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError('Invalid email or password');
    }

    // Generate short-lived access token
    const accessToken = this.generateAccessToken(user);
    
    // Generate and store refresh token
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      token: accessToken, // Backward compatibility alias
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const { username, email } = data;

    if (!username && !email) {
      throw new BadRequestError('At least one field must be provided for update');
    }

    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                email ? { email } : {},
                username ? { username } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new BadRequestError('Email already in use');
        }
        if (existingUser.username === username) {
          throw new BadRequestError('Username already in use');
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestError('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens when password is changed
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(data: RefreshTokenInput) {
    const { refreshToken } = data;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            username: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.revoked) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(storedToken.user);

    return {
      accessToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: storedToken.user.id,
        username: storedToken.user.username,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string) {
    const result = await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revoked: false },
      data: { revoked: true },
    });

    if (result.count === 0) {
      throw new BadRequestError('Invalid or already revoked token');
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Cleanup expired refresh tokens (can be called periodically)
   */
  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revoked: true },
        ],
      },
    });

    return { deleted: result.count };
  }
}

export default new AuthService();
