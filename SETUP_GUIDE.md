# 🚀 Setup Guide

Complete guide to set up and run the Canteen Order Management System after cloning the repository.

---

## 📋 Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Docker & Docker Compose**: Latest version (for Docker setup)
- **PostgreSQL**: v16 or higher (for local setup)

---

## 🐳 Method 1: Docker Setup (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/7FIl/freepass-2026
cd freepass-2026
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV="production"
PORT=3000
JWT_SECRET="your-strong-jwt-secret-here-change-this"

POSTGRES_USER=root
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=canteen_db
POSTGRES_PORT=5432

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
```

**Important**: 
- `JWT_SECRET` is **required** - application will fail to start if not set (min 32 characters recommended)
- Change `POSTGRES_PASSWORD` to a secure value
- Never commit `.env` file to version control

### Step 3: Start Docker Containers

```bash
docker-compose up -d
```

This will:
- Build the application container
- Start PostgreSQL database
- Run database migrations
- Create admin user (root@admin.com / <your-password>)
- Start the application on port 3000

### Step 4: Verify Setup

Check if containers are running:
```bash
docker ps
```

You should see:
- `canteen-postgres` (PostgreSQL)
- `canteen-app` (Application)

Check application logs:
```bash
docker logs canteen-app
```

### Step 5: Access the Application

API is now running at: `http://localhost:3000`

Test health check:
```bash
curl http://localhost:3000/health
```

### Step 6: Login with Admin Account

**Default Admin Credentials:**
- Email: `root@admin.com`
- Password: `<POSTGRES_PASSWORD from your .env>`

**Login Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@admin.com","password":"your-password"}'
```

### Optional: Seed Sample Data

**Note**: Full sample data seeding is not available in Docker due to compilation limitations. Use local development setup if you need the full seed data.

For local development only, see [Method 2: Local Development Setup](#local-development-commands) below.

### Docker Management Commands

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (full reset)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# View logs
docker logs canteen-app -f

# Access database (replace 'root' with your POSTGRES_USER from .env)
docker exec -it canteen-postgres psql -U root -d canteen_db
```

---

## 💻 Method 2: Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd freepass-2026
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup PostgreSQL Database

Create a PostgreSQL database:
```sql
CREATE DATABASE canteen_db;
```

### Step 4: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` for local development:

```env
NODE_ENV="development"
PORT=3000
JWT_SECRET="your-dev-jwt-secret"

POSTGRES_USER=your-postgres-username
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=canteen_db
POSTGRES_PORT=5432

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
```

### Step 5: Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 6: Seed Admin User

```bash
npx ts-node scripts/seed-admin.ts
```

This creates admin account:
- Email: `root@admin.com`
- Password: `<POSTGRES_PASSWORD from your .env>`

### Step 7: Start Development Server

```bash
npm run dev
```

Application runs at: `http://localhost:3000`

### Optional: Seed Sample Data

```bash
npx ts-node scripts/seed-full.ts
```

This creates:
- 8 users (students and canteen owners)
- 3 canteens with menu items
- 5 sample orders
- 3 reviews

### Local Development Commands

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (Database GUI)
npx prisma studio

# Format code
npm run lint:fix
```

---

## 🔑 Default Credentials

### Admin Account (Created by default)
- **Email**: `root@admin.com`
- **Password**: `<your POSTGRES_PASSWORD from .env>`
- **Role**: ADMIN
- Can manage all canteens, users, and orders

### Sample Users (After running seed-full.ts)

**Students:**
- john.doe@gmail.com / password123
- jane.smith@outlook.com / password123
- bob.wilson@yahoo.com / password123

**Canteen Owners:**
- alice.brown@gmail.com / password123
- charlie.davis@gmail.com / password123
- diana.evans@gmail.com / password123

---

## 📚 API Documentation

After setup, refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for:
- Complete endpoint reference
- Request/response examples
- Authentication requirements
- Error codes and handling

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.ts
```

All 117 tests should pass:
- ✅ 25 Authentication tests
- ✅ 30 Admin management tests
- ✅ 29 Canteen management tests
- ✅ 33 Order management tests

---

## 🐛 Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Change PORT in .env file or stop conflicting service
docker-compose down
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
docker logs canteen-postgres

# Restart containers
docker-compose restart
```

**Permission denied errors:**
```bash
# On Linux/Mac, try with sudo
sudo docker-compose up -d
```

### Local Development Issues

**Prisma Client errors:**
```bash
npx prisma generate
```

**Database migration errors:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then re-seed
npx ts-node scripts/seed-admin.ts
```

**Port 3000 already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Security Recommendations

### For Production Deployment:

1. **Change Default Credentials:**
   - Set strong `JWT_SECRET` (min 32 characters)
   - Use complex `POSTGRES_PASSWORD`
   - Change admin password after first login

2. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use secure credential management (AWS Secrets Manager, Azure Key Vault, etc.)

3. **Database:**
   - Use managed PostgreSQL service (AWS RDS, Azure Database, etc.)
   - Enable SSL/TLS connections
   - Regular backups

4. **Application:**
   - Set `NODE_ENV=production`
   - Enable HTTPS/SSL
   - Configure CORS properly
   - Rate limiting already configured:
     - Registration: 5 requests/minute per IP
     - Login: 3 requests/minute per IP (brute force protection)

---

## 📞 Support

If you encounter issues:
1. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API usage
2. Review test files in `src/__tests__/` for usage examples
3. Check application logs: `docker logs canteen-app -f`
4. Verify environment variables in `.env` file

**Ready to go!** Your Canteen Order Management System is now set up and running.
