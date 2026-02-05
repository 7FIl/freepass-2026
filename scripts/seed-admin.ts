import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin user...');

  const adminPassword = process.env.POSTGRES_PASSWORD || '12345678';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'root@admin.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      username: 'root',
      email: 'root@admin.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created successfully:', {
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error('Error seeding admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
