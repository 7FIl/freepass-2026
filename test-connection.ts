import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/canteen_db',
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing Prisma connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');
    
    const users = await prisma.user.findMany();
    console.log('Users count:', users.length);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testConnection();
