import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { CreateUserInput, UpdateUserInput } from '../validations/admin.validation';
import { BadRequestError, NotFoundError } from '../types/errors';
import { invalidateAllowedDomainsCache, isEmailDomainAllowed } from '../utils/allowedDomains';

export class AdminService {
  async createUser(data: CreateUserInput) {
    const domainAllowed = await isEmailDomainAllowed(data.email);
    if (!domainAllowed) {
      throw new BadRequestError('Email domain not allowed');
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new BadRequestError('Email already in use');
      }
      if (existingUser.username === data.username) {
        throw new BadRequestError('Username already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role,
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

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count();
    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (data.email && data.email !== user.email) {
      const domainAllowed = await isEmailDomainAllowed(data.email);
      if (!domainAllowed) {
        throw new BadRequestError('Email domain not allowed');
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new BadRequestError('Email already in use');
      }
    }

    if (data.username && data.username !== user.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existingUsername) {
        throw new BadRequestError('Username already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: data.username || user.username,
        email: data.email || user.email,
        role: data.role || user.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'CANTEEN_OWNER') {
      await prisma.canteen.deleteMany({
        where: { ownerId: userId },
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  async getCanteenOwners(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const owners = await prisma.user.findMany({
      where: { role: 'CANTEEN_OWNER' },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        canteens: {
          select: {
            id: true,
            name: true,
            isOpen: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({
      where: { role: 'CANTEEN_OWNER' },
    });
    const totalPages = Math.ceil(total / limit);

    return {
      data: owners,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getAllowedDomains(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const domains = await prisma.allowedEmailDomain.findMany({
      select: {
        id: true,
        domain: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { domain: 'asc' },
    });

    const total = await prisma.allowedEmailDomain.count();
    const totalPages = Math.ceil(total / limit);

    return {
      data: domains,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async addAllowedDomain(domain: string) {
    const normalizedDomain = domain.toLowerCase().trim();

    const existing = await prisma.allowedEmailDomain.findUnique({
      where: { domain: normalizedDomain },
    });

    if (existing) {
      throw new BadRequestError('Domain already exists');
    }

    const created = await prisma.allowedEmailDomain.create({
      data: { domain: normalizedDomain },
      select: {
        id: true,
        domain: true,
        createdAt: true,
      },
    });

    invalidateAllowedDomainsCache();

    return created;
  }

  async deleteAllowedDomain(domainId: string) {
    const domain = await prisma.allowedEmailDomain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new NotFoundError('Domain not found');
    }

    await prisma.allowedEmailDomain.delete({
      where: { id: domainId },
    });

    invalidateAllowedDomainsCache();

    return { message: 'Domain deleted successfully' };
  }
}

export default new AdminService();
