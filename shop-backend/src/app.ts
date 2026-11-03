/**
 * app.ts — Express application factory.
 *
 * Separated from server.ts so tests can import the app without
 * binding to a port or running DB health checks.
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import dashboardRoutes from './routes/dashboard.routes';
import bomRoutes from './routes/bom.routes';
import manufacturingRoutes from './routes/manufacturing.routes';
import invoiceRoutes from './routes/invoice.routes';
import { sanitizeInputs } from './middlewares/sanitize.middleware';

export function createApp(): Express {
  const app: Express = express();

  // Security Middleware
  app.use(helmet());

  // Rate Limiting (100 requests per 15 minutes)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  });
  app.use(limiter);

  // CORS configuration for Secure Cookies
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));

  // Parsers
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // XSS Sanitization
  app.use(sanitizeInputs);

  // Health Check Route
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/bom', bomRoutes);
  app.use('/api/v1/manufacturing', manufacturingRoutes);
  app.use('/api/v1/invoices', invoiceRoutes);

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  return app;
}
