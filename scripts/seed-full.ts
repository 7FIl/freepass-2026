import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Full database seeding script
 * 
 * This script extends the admin seed by adding:
 * - Regular users
 * - Canteen owners
 * - Canteens with menu items
 * - Orders with payments
 * - Reviews
 * 
 * Prerequisites: Run seed-admin.ts first OR this script will create admin + allowed domains
 */

// Default allowed email domains (same as admin seed)
const DEFAULT_ALLOWED_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'yandex.ru',
  'mail.ru',
  'qq.com',
  '163.com',
  '126.com',
  'student.ub.ac.id',
  'ub.ac.id',
  'admin.com',
];

async function seedAllowedDomains() {
  console.log('Seeding allowed email domains...');
  
  const existingDomains = await prisma.allowedEmailDomain.count();
  if (existingDomains > 0) {
    console.log('✓ Allowed domains already exist, skipping...');
    return;
  }

  const result = await prisma.allowedEmailDomain.createMany({
    data: DEFAULT_ALLOWED_DOMAINS.map((domain) => ({ domain })),
    skipDuplicates: true,
  });

  console.log(`✓ Created ${result.count} allowed email domains`);
}

async function seedAdminUser(hashedPassword: string) {
  console.log('Seeding admin user...');

  const admin = await prisma.user.upsert({
    where: { email: 'root@admin.com' },
    update: {},
    create: {
      username: 'root',
      email: 'root@admin.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✓ Admin user ready');
  return admin;
}

async function main() {
  console.log('Starting full database seeding...\n');

  // Check if full seed data already exists
  const existingUsers = await prisma.user.count();
  if (existingUsers > 1) {
    console.log('Database already has data. Skipping full seed...');
    console.log('To re-seed, please reset the database first.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Password123', 10);

  // 1. Seed allowed domains and admin user first
  await seedAllowedDomains();
  await seedAdminUser(hashedPassword);

  // 2. Create Regular Users
  console.log('\nCreating regular users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'john_doe',
        email: 'john.doe@gmail.com',
        password: hashedPassword,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'jane_smith',
        email: 'jane.smith@outlook.com',
        password: hashedPassword,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'mike_wilson',
        email: 'mike.wilson@yahoo.com',
        password: hashedPassword,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'sarah_jones',
        email: 'sarah.jones@gmail.com',
        password: hashedPassword,
        role: 'USER',
      },
    }),
  ]);
  console.log(`✓ Created ${users.length} regular users`);

  // 3. Create Canteen Owners
  console.log('Creating canteen owners...');
  const canteenOwners = await Promise.all([
    prisma.user.create({
      data: {
        username: 'owner_tony',
        email: 'tony.restaurant@gmail.com',
        password: hashedPassword,
        role: 'CANTEEN_OWNER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'owner_maria',
        email: 'maria.kitchen@outlook.com',
        password: hashedPassword,
        role: 'CANTEEN_OWNER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'owner_david',
        email: 'david.cafe@yahoo.com',
        password: hashedPassword,
        role: 'CANTEEN_OWNER',
      },
    }),
  ]);
  console.log(`✓ Created ${canteenOwners.length} canteen owners`);

  // 4. Create Canteens with Menu Items
  console.log('\nCreating canteens and menu items...');

  // Canteen 1: Tony's Burger House
  const canteen1 = await prisma.canteen.create({
    data: {
      name: "Tony's Burger House",
      isOpen: true,
      ownerId: canteenOwners[0].id,
    },
  });

  const canteen1Menu = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, and special sauce',
        price: 45000,
        stock: 50,
        canteenId: canteen1.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chicken Wings (6pcs)',
        description: 'Crispy fried chicken wings with BBQ sauce',
        price: 35000,
        stock: 40,
        canteenId: canteen1.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'French Fries',
        description: 'Golden crispy fries with ketchup',
        price: 15000,
        stock: 100,
        canteenId: canteen1.id,
      },
    }),
  ]);
  console.log(`✓ Created "${canteen1.name}" with ${canteen1Menu.length} menu items`);

  // Canteen 2: Maria's Kitchen
  const canteen2 = await prisma.canteen.create({
    data: {
      name: "Maria's Kitchen",
      isOpen: true,
      ownerId: canteenOwners[1].id,
    },
  });

  const canteen2Menu = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: 'Nasi Goreng Special',
        description: 'Indonesian fried rice with chicken, egg, and crackers',
        price: 25000,
        stock: 60,
        canteenId: canteen2.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Mie Ayam',
        description: 'Chicken noodles with vegetables and broth',
        price: 20000,
        stock: 70,
        canteenId: canteen2.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Es Teh Manis',
        description: 'Sweet iced tea',
        price: 5000,
        stock: 150,
        canteenId: canteen2.id,
      },
    }),
  ]);
  console.log(`✓ Created "${canteen2.name}" with ${canteen2Menu.length} menu items`);

  // Canteen 3: David's Cafe
  const canteen3 = await prisma.canteen.create({
    data: {
      name: "David's Cafe",
      isOpen: true,
      ownerId: canteenOwners[2].id,
    },
  });

  const canteen3Menu = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: 'Cappuccino',
        description: 'Classic Italian coffee with steamed milk foam',
        price: 28000,
        stock: 80,
        canteenId: canteen3.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chocolate Croissant',
        description: 'Freshly baked croissant filled with chocolate',
        price: 22000,
        stock: 30,
        canteenId: canteen3.id,
      },
    }),
  ]);
  console.log(`✓ Created "${canteen3.name}" with ${canteen3Menu.length} menu items`);

  // 5. Create Orders with Payments
  console.log('\nCreating orders with payments...');

  // Order 1: John orders from Tony's Burger House (COMPLETED)
  const order1 = await prisma.order.create({
    data: {
      userId: users[0].id,
      canteenId: canteen1.id,
      totalPrice: 105000,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            menuItemId: canteen1Menu[0].id,
            quantity: 2,
            price: 90000,
          },
          {
            menuItemId: canteen1Menu[2].id,
            quantity: 1,
            price: 15000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 105000,
      status: 'PAID',
    },
  });

  // Order 2: Jane orders from Maria's Kitchen (COMPLETED)
  const order2 = await prisma.order.create({
    data: {
      userId: users[1].id,
      canteenId: canteen2.id,
      totalPrice: 50000,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            menuItemId: canteen2Menu[0].id,
            quantity: 1,
            price: 25000,
          },
          {
            menuItemId: canteen2Menu[1].id,
            quantity: 1,
            price: 20000,
          },
          {
            menuItemId: canteen2Menu[2].id,
            quantity: 1,
            price: 5000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: 50000,
      status: 'PAID',
    },
  });

  // Order 3: Mike orders from David's Cafe (READY)
  const order3 = await prisma.order.create({
    data: {
      userId: users[2].id,
      canteenId: canteen3.id,
      totalPrice: 78000,
      status: 'READY',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            menuItemId: canteen3Menu[0].id,
            quantity: 2,
            price: 56000,
          },
          {
            menuItemId: canteen3Menu[1].id,
            quantity: 1,
            price: 22000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      amount: 78000,
      status: 'PAID',
    },
  });

  // Order 4: Sarah orders from Tony's Burger House (COOKING)
  const order4 = await prisma.order.create({
    data: {
      userId: users[3].id,
      canteenId: canteen1.id,
      totalPrice: 80000,
      status: 'COOKING',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            menuItemId: canteen1Menu[0].id,
            quantity: 1,
            price: 45000,
          },
          {
            menuItemId: canteen1Menu[1].id,
            quantity: 1,
            price: 35000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order4.id,
      amount: 80000,
      status: 'PAID',
    },
  });

  // Order 5: John orders from Maria's Kitchen (WAITING, UNPAID)
  const order5 = await prisma.order.create({
    data: {
      userId: users[0].id,
      canteenId: canteen2.id,
      totalPrice: 45000,
      status: 'WAITING',
      paymentStatus: 'UNPAID',
      items: {
        create: [
          {
            menuItemId: canteen2Menu[0].id,
            quantity: 1,
            price: 25000,
          },
          {
            menuItemId: canteen2Menu[1].id,
            quantity: 1,
            price: 20000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order5.id,
      amount: 45000,
      status: 'UNPAID',
    },
  });

  console.log('✓ Created 5 orders with payments');

  // 6. Create Reviews (only for completed orders)
  console.log('\nCreating reviews...');

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        orderId: order1.id,
        userId: users[0].id,
        rating: 5,
        comment: 'Amazing burgers! The beef patty was perfectly cooked and juicy. Will definitely order again!',
      },
    }),
    prisma.review.create({
      data: {
        orderId: order2.id,
        userId: users[1].id,
        rating: 4,
        comment: 'Great traditional Indonesian food. The Nasi Goreng was delicious!',
      },
    }),
  ]);

  console.log(`✓ Created ${reviews.length} reviews`);

  // 7. Summary
  console.log('\n' + '='.repeat(50));
  console.log('           SEEDING COMPLETE');
  console.log('='.repeat(50));
  console.log('\nDatabase has been populated with:');
  console.log(`  • 1 Admin user`);
  console.log(`  • ${users.length} Regular users`);
  console.log(`  • ${canteenOwners.length} Canteen owners`);
  console.log(`  • 3 Canteens with ${canteen1Menu.length + canteen2Menu.length + canteen3Menu.length} total menu items`);
  console.log(`  • 5 Orders (2 completed, 1 ready, 1 cooking, 1 waiting)`);
  console.log(`  • ${reviews.length} Reviews`);
  console.log(`  • ${DEFAULT_ALLOWED_DOMAINS.length} Allowed email domains`);
  
  console.log('\n' + '-'.repeat(50));
  console.log('TEST CREDENTIALS (all use password: Password123)');
  console.log('-'.repeat(50));
  console.log('Admin:         root@admin.com');
  console.log('User:          john.doe@gmail.com');
  console.log('User:          jane.smith@outlook.com');
  console.log('Canteen Owner: tony.restaurant@gmail.com');
  console.log('Canteen Owner: maria.kitchen@outlook.com');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
