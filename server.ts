import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

import authRoutes from './server/routes/auth.ts';
import productRoutes from './server/routes/products.ts';
import categoryRoutes from './server/routes/categories.ts';
import cartRoutes from './server/routes/cart.ts';
import orderRoutes from './server/routes/orders.ts';
import reviewRoutes from './server/routes/reviews.ts';
import couponRoutes from './server/routes/coupons.ts';
import userRoutes from './server/routes/users.ts';
import contactRoutes from './server/routes/contact.ts';
import adminRoutes from './server/routes/admin.ts';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic security & caching headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'FreshSip Juice Shop API',
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
      error: isProduction ? 'An unexpected server error occurred' : err.message || 'Internal Server Error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FreshSip Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FreshSip] Server failed to start:', err);
  process.exit(1);
});
