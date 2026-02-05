import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Check if data already exists
  const existingUsers = await prisma.user.count();
  if (existingUsers > 1) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  // 1. Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('12345678', 10);

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
  console.log('✓ Admin user created');

  // 2. Create Regular Users
  console.log('Creating regular users...');
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
  console.log('Creating canteens and menu items...');

  // Canteen 1: Tony's Burger House
  const canteen1 = await prisma.canteen.create({
    data: {
      name: "Tony's Burger House",
      location: 'Building A, Floor 1, Campus North',
      contactInfo: '+62812345678',
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
        category: 'Main Course',
        isAvailable: true,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
        canteenId: canteen1.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chicken Wings (6pcs)',
        description: 'Crispy fried chicken wings with BBQ sauce',
        price: 35000,
        category: 'Main Course',
        isAvailable: true,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2',
        canteenId: canteen1.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'French Fries',
        description: 'Golden crispy fries with ketchup',
        price: 15000,
        category: 'Snacks',
        isAvailable: true,
        stock: 100,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
        canteenId: canteen1.id,
      },
    }),
  ]);
  console.log(`✓ Created ${canteen1.name} with ${canteen1Menu.length} menu items`);

  // Canteen 2: Maria's Kitchen
  const canteen2 = await prisma.canteen.create({
    data: {
      name: "Maria's Kitchen",
      location: 'Building B, Floor 2, Campus South',
      contactInfo: '+62823456789',
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
        category: 'Main Course',
        isAvailable: true,
        stock: 60,
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
        canteenId: canteen2.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Mie Ayam',
        description: 'Chicken noodles with vegetables and broth',
        price: 20000,
        category: 'Main Course',
        isAvailable: true,
        stock: 70,
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
        canteenId: canteen2.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Es Teh Manis',
        description: 'Sweet iced tea',
        price: 5000,
        category: 'Beverages',
        isAvailable: true,
        stock: 150,
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc',
        canteenId: canteen2.id,
      },
    }),
  ]);
  console.log(`✓ Created ${canteen2.name} with ${canteen2Menu.length} menu items`);

  // Canteen 3: David's Cafe
  const canteen3 = await prisma.canteen.create({
    data: {
      name: "David's Cafe",
      location: 'Building C, Ground Floor, Campus East',
      contactInfo: '+62834567890',
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
        category: 'Beverages',
        isAvailable: true,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d',
        canteenId: canteen3.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chocolate Croissant',
        description: 'Freshly baked croissant filled with chocolate',
        price: 22000,
        category: 'Snacks',
        isAvailable: true,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
        canteenId: canteen3.id,
      },
    }),
  ]);
  console.log(`✓ Created ${canteen3.name} with ${canteen3Menu.length} menu items`);

  // 5. Create Orders with Payments
  console.log('Creating orders with payments...');

  // Order 1: John orders from Tony's Burger House
  const order1 = await prisma.order.create({
    data: {
      userId: users[0].id,
      canteenId: canteen1.id,
      totalPrice: 95000,
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
      amount: 95000,
      status: 'PAID',
    },
  });

  // Order 2: Jane orders from Maria's Kitchen
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

  // Order 3: Mike orders from David's Cafe
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

  // Order 4: Sarah orders from Tony's Burger House
  const order4 = await prisma.order.create({
    data: {
      userId: users[3].id,
      canteenId: canteen1.id,
      totalPrice: 80000,
      status: 'PREPARING',
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

  // Order 5: John orders from Maria's Kitchen (pending)
  const order5 = await prisma.order.create({
    data: {
      userId: users[0].id,
      canteenId: canteen2.id,
      totalPrice: 45000,
      status: 'PENDING',
      paymentStatus: 'PENDING',
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

  console.log('✓ Created 5 orders with payments');

  // 6. Create Reviews
  console.log('Creating reviews...');

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        orderId: order1.id,
        userId: users[0].id,
        canteenId: canteen1.id,
        rating: 5,
        comment: 'Amazing burgers! The beef patty was perfectly cooked and juicy. Will definitely order again!',
      },
    }),
    prisma.review.create({
      data: {
        orderId: order2.id,
        userId: users[1].id,
        canteenId: canteen2.id,
        rating: 4,
        comment: 'Great traditional Indonesian food. The Nasi Goreng was delicious, but the Mie Ayam could use a bit more flavor.',
      },
    }),
    prisma.review.create({
      data: {
        orderId: order1.id,
        userId: users[0].id,
        canteenId: canteen1.id,
        rating: 5,
        comment: 'Fast service and great taste. The fries were crispy and hot!',
      },
    }),
  ]);

  console.log(`✓ Created ${reviews.length} reviews`);

  // 7. Summary
  console.log('\n=== Seeding Complete ===');
  console.log('Database has been populated with:');
  console.log(`- 1 Admin user (root / root@admin.com / 12345678)`);
  console.log(`- ${users.length} Regular users`);
  console.log(`- ${canteenOwners.length} Canteen owners`);
  console.log(`- 3 Canteens with 7 total menu items`);
  console.log(`- 5 Orders`);
  console.log(`- ${reviews.length} Reviews`);
  console.log('\nTest Credentials:');
  console.log('Admin: root@admin.com / 12345678');
  console.log('User: john.doe@gmail.com / 12345678');
  console.log('Canteen Owner: tony.restaurant@gmail.com / 12345678');
  console.log('\nAll users have the same password: 12345678');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
