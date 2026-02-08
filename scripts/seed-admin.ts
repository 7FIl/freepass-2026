import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default allowed email domains
const DEFAULT_ALLOWED_DOMAINS = [
  'gmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  '163.com',
  'qq.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yandex.ru',
  'yahoo.com',
  '126.com',
  'proton.me',
  'protonmail.com',
  'mail.ru',
  'student.ub.ac.id',
  'ub.ac.id',
  'admin.com', // For admin user
];

async function seedAllowedEmailDomains() {
  console.log('Seeding allowed email domains...');

  const existingDomains = await prisma.allowedEmailDomain.findMany({
    select: { domain: true },
  });
  const existingDomainSet = new Set(existingDomains.map(d => d.domain));

  const domainsToCreate = DEFAULT_ALLOWED_DOMAINS.filter(
    domain => !existingDomainSet.has(domain)
  );

  if (domainsToCreate.length === 0) {
    console.log('All allowed email domains already exist');
    return;
  }

  await prisma.allowedEmailDomain.createMany({
    data: domainsToCreate.map(domain => ({ domain })),
    skipDuplicates: true,
  });

  console.log(`Created ${domainsToCreate.length} allowed email domains`);
}

async function seedAdminUser() {
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

async function main() {
  // Seed allowed email domains first
  await seedAllowedEmailDomains();
  
  // Seed admin user
  await seedAdminUser();
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
