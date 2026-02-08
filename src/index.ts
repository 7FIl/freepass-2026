import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import prisma from './utils/prisma';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { asyncHandler } from './utils/asyncHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Canteen Order API is running',
  });
});

app.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  // Check database connection
  await prisma.$queryRaw`SELECT 1`;
  
  res.json({
    success: true,
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
}));

app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

