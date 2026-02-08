import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import routes from './routes';
import prisma from './utils/prisma';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { asyncHandler } from './utils/asyncHandler';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

const isTest = process.env.NODE_ENV === 'test';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!isTest) {
  app.use(pinoHttp({ logger }));
}

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Canteen Order API is running',
  });
});

app.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  
  res.json({
    success: true,
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
}));

app.use('/api', routes);

app.use(errorHandler);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server is running');
});

export default app;

