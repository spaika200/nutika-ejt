import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import client from 'prom-client';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import savingsRoutes from './routes/savings';
import userRoutes from './routes/users';
import { NordPoolService } from './services/nordpool';
import { runAutomationCycle } from './services/automation';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'nutika_' });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'nutika_http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging & metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode.toString())
      .observe(duration);
    
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/users', userRoutes);

// Elering Prices endpoint
app.get('/api/prices', async (req: Request, res: Response) => {
  try {
    const prices = await NordPoolService.fetchPrices();
    res.json(prices);
  } catch (error) {
    logger.error('Error fetching prices', { error });
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Start Automation Worker (runs every minute in background)
setInterval(() => {
  runAutomationCycle();
}, 60000);

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled Exception', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
