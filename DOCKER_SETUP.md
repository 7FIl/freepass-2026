# Docker Setup Guide

## Overview
This application is containerized using Docker and Docker Compose with:
- **Node.js App**: Running on port 3000
- **PostgreSQL Database**: Running on port 5432

## Database Credentials

### PostgreSQL
- **Host**: localhost (or `postgres` from within containers)
- **Port**: 5432
- **Database**: canteen_db
- **Username**: root
- **Password**: 12345678

### Admin User (Application)
After the container starts, an admin user will be automatically created:
- **Username**: root
- **Email**: root@admin.com
- **Password**: 12345678
- **Role**: ADMIN

## Quick Start

### 1. Build and Start Containers
```bash
npm run docker:build
npm run docker:up
```

Or using Docker Compose directly:
```bash
docker-compose build
docker-compose up -d
```

### 2. View Logs
```bash
npm run docker:logs
```

Or:
```bash
docker-compose logs -f
```

### 3. Stop Containers
```bash
npm run docker:down
```

Or:
```bash
docker-compose down
```

## Manual Setup Steps

### 1. Build the Docker Image
```bash
docker-compose build
```

### 2. Start Services
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL container
- Wait for PostgreSQL to be ready (health check)
- Start the Node.js app container
- Run Prisma migrations
- Seed the admin user
- Start the API server

### 3. Verify Services are Running
```bash
docker ps
```

You should see two containers:
- `canteen-postgres` (PostgreSQL database)
- `canteen-app` (Node.js application)

### 4. Access the Application
- **API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/

### 5. Access PostgreSQL
From your host machine:
```bash
psql -h localhost -p 5432 -U root -d canteen_db
# Password: 12345678
```

Or using a GUI tool like pgAdmin or DBeaver:
- Host: localhost
- Port: 5432
- Database: canteen_db
- Username: root
- Password: 12345678

## Container Management

### View Container Logs
```bash
# All logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Database logs only
docker-compose logs -f postgres
```

### Restart Containers
```bash
docker-compose restart
```

### Stop and Remove Containers (Keep Data)
```bash
docker-compose down
```

### Stop and Remove Containers + Data (Fresh Start)
```bash
docker-compose down -v
```

### Execute Commands Inside Container
```bash
# Access app container shell
docker exec -it canteen-app sh

# Access database shell
docker exec -it canteen-postgres psql -U root -d canteen_db
```

## Database Migrations

Migrations are automatically run when the container starts. To run them manually:

```bash
# Inside the app container
docker exec -it canteen-app npx prisma migrate deploy

# Or from your host (if dependencies are installed locally)
npm run prisma:migrate
```

## Seed Admin User

The admin user is automatically created on container startup. To manually seed:

```bash
# Inside the app container
docker exec -it canteen-app npx ts-node scripts/seed-admin.ts

# Or from your host
npm run seed:admin
```

## Environment Variables

The following environment variables are configured in `docker-compose.yml`:

### App Container
- `NODE_ENV`: production
- `DATABASE_URL`: postgresql://root:12345678@postgres:5432/canteen_db
- `PORT`: 3000
- `JWT_SECRET`: your-production-jwt-secret-change-this

### PostgreSQL Container
- `POSTGRES_USER`: root
- `POSTGRES_PASSWORD`: 12345678
- `POSTGRES_DB`: canteen_db

**Important**: Change `JWT_SECRET` in production!

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check if port is already in use
netstat -ano | findstr :3000
netstat -ano | findstr :5432
```

### Database Connection Issues
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Test database connection
docker exec -it canteen-postgres pg_isready -U root -d canteen_db
```

### Reset Everything
```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove images
docker rmi freepass-2026-app

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Admin User Not Created
```bash
# Manually run the seed script
docker exec -it canteen-app npx ts-node scripts/seed-admin.ts
```

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** in `docker-compose.yml` to a strong secret
2. **Change Database Password** for security
3. **Use Docker Secrets** or environment files for sensitive data
4. **Configure SSL/TLS** for PostgreSQL connections
5. **Set up proper backup strategy** for the database volume
6. **Configure reverse proxy** (nginx) for the app
7. **Enable rate limiting** and security headers

## Development vs Production

### Development (Local)
```bash
npm run dev
```
Uses local PostgreSQL and hot-reload.

### Production (Docker)
```bash
npm run docker:up
```
Uses containerized PostgreSQL and production build.

## Data Persistence

PostgreSQL data is stored in a Docker volume named `postgres_data`. This ensures data persists across container restarts.

To backup the database:
```bash
docker exec canteen-postgres pg_dump -U root canteen_db > backup.sql
```

To restore:
```bash
docker exec -i canteen-postgres psql -U root canteen_db < backup.sql
```
