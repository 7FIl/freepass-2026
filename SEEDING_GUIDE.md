# Database Seeding Guide

## Overview
This project includes comprehensive database seeding scripts to populate the database with sample data for testing and demonstration purposes.

## Seeding Scripts

### 1. Admin Only Seeder (`seed-admin.ts`)
Creates only the admin user.

**Run:**
```bash
npm run seed:admin
```

**Creates:**
- 1 Admin user
  - Username: `root`
  - Email: `root@admin.com`
  - Password: `12345678`
  - Role: `ADMIN`

### 2. Full Database Seeder (`seed-full.ts`)
Creates a complete set of sample data including users, canteens, menu items, orders, payments, and reviews.

**Run:**
```bash
npm run seed:full
# or simply
npm run seed
```

**Creates:**

#### Users (5 total)
1. **Admin User**
   - Username: `root`
   - Email: `root@admin.com`
   - Password: `12345678`
   - Role: `ADMIN`

2. **Regular Users (4)**
   - `john_doe` - john.doe@gmail.com
   - `jane_smith` - jane.smith@outlook.com
   - `mike_wilson` - mike.wilson@yahoo.com
   - `sarah_jones` - sarah.jones@gmail.com
   - All passwords: `12345678`

3. **Canteen Owners (3)**
   - `owner_tony` - tony.restaurant@gmail.com
   - `owner_maria` - maria.kitchen@outlook.com
   - `owner_david` - david.cafe@yahoo.com
   - All passwords: `12345678`

#### Canteens & Menu Items

**Tony's Burger House** (Building A, Floor 1)
- Classic Beef Burger - Rp 45,000 (50 stock)
- Chicken Wings (6pcs) - Rp 35,000 (40 stock)
- French Fries - Rp 15,000 (100 stock)

**Maria's Kitchen** (Building B, Floor 2)
- Nasi Goreng Special - Rp 25,000 (60 stock)
- Mie Ayam - Rp 20,000 (70 stock)
- Es Teh Manis - Rp 5,000 (150 stock)

**David's Cafe** (Building C, Ground Floor)
- Cappuccino - Rp 28,000 (80 stock)
- Chocolate Croissant - Rp 22,000 (30 stock)

#### Orders (5 total)
1. **John** orders from Tony's Burger House
   - 2x Classic Beef Burger + 1x French Fries
   - Total: Rp 95,000
   - Status: `COMPLETED` | Payment: `PAID`

2. **Jane** orders from Maria's Kitchen
   - 1x Nasi Goreng + 1x Mie Ayam + 1x Es Teh
   - Total: Rp 50,000
   - Status: `COMPLETED` | Payment: `PAID`

3. **Mike** orders from David's Cafe
   - 2x Cappuccino + 1x Chocolate Croissant
   - Total: Rp 78,000
   - Status: `READY` | Payment: `PAID`

4. **Sarah** orders from Tony's Burger House
   - 1x Classic Beef Burger + 1x Chicken Wings
   - Total: Rp 80,000
   - Status: `PREPARING` | Payment: `PAID`

5. **John** orders from Maria's Kitchen
   - 1x Nasi Goreng + 1x Mie Ayam
   - Total: Rp 45,000
   - Status: `PENDING` | Payment: `PENDING`

#### Reviews (3 total)
- John's review for Tony's Burger House (5 stars)
- Jane's review for Maria's Kitchen (4 stars)
- Another review for Tony's Burger House (5 stars)

## Usage Scenarios

### Local Development
```bash
# Reset database and seed
npx prisma migrate reset --force
npm run seed:full
```

### Docker Environment
The full seeder runs automatically when starting Docker containers:
```bash
npm run docker:build
npm run docker:up
```

### Manual Seeding in Docker
```bash
# Seed only admin
docker exec -it canteen-app npx ts-node scripts/seed-admin.ts

# Full seed
docker exec -it canteen-app npx ts-node scripts/seed-full.ts
```

## Test Credentials

### Admin Account
- **Email**: root@admin.com
- **Password**: 12345678
- **Use for**: Admin operations (user management, etc.)

### Regular User Account
- **Email**: john.doe@gmail.com
- **Password**: 12345678
- **Use for**: Placing orders, writing reviews

### Canteen Owner Account
- **Email**: tony.restaurant@gmail.com
- **Password**: 12345678
- **Use for**: Managing canteen, menu items, viewing orders

## API Testing Examples

### 1. Login as User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@gmail.com",
    "password": "12345678"
  }'
```

### 2. Get All Canteens
```bash
curl http://localhost:3000/api/canteens
```

### 3. Get Menu Items
```bash
curl http://localhost:3000/api/canteens/{canteenId}/menu
```

### 4. View User Orders
```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer {token}"
```

### 5. View Canteen Reviews
```bash
curl http://localhost:3000/api/orders/canteen/{canteenId}/reviews
```

## Database Management

### Reset Database
```bash
# Warning: This will delete all data!
npx prisma migrate reset --force

# Then seed again
npm run seed:full
```

### View Data in Prisma Studio
```bash
npm run prisma:studio
```

Opens a web interface at http://localhost:5555 to view and manage database records.

### Check Seeded Data
```bash
# Connect to PostgreSQL
psql -h localhost -p 5432 -U root -d canteen_db

# Query examples
SELECT * FROM "User";
SELECT * FROM "Canteen";
SELECT * FROM "MenuItem";
SELECT * FROM "Order";
SELECT * FROM "Review";
```

## Troubleshooting

### Seeder Already Ran
The full seeder checks if data exists and skips if database is already seeded. To re-seed:
```bash
npx prisma migrate reset --force
npm run seed:full
```

### Foreign Key Errors
Ensure migrations are up to date:
```bash
npx prisma migrate deploy
npm run seed:full
```

### Permission Denied
Make sure the database user has proper permissions:
```bash
# Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE canteen_db TO root;
```

## Customization

To modify seed data, edit `scripts/seed-full.ts`:
- Add more users in the users array
- Create additional canteens with unique data
- Add more menu items per canteen
- Create various order scenarios
- Add more reviews with different ratings

## Production Notes

**⚠️ Important**: Do not run seeders in production environments!

The seeder is designed for:
- Development environments
- Testing
- Demonstrations
- CI/CD test pipelines

For production, create users through the API and admin panel only.
