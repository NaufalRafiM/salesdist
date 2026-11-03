import { Router } from 'express';
import { authRouter } from './authRoutes';
import { picRouter } from './picRoutes';
import { adminRouter } from './adminRoutes';
import { masterRouter } from './masterRoutes';
import { sqlRouter } from './sqlRoutes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/pic', picRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/master', masterRouter);
apiRouter.use('/sql', sqlRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'SQL Relasional (SQLite / WAL Mode / ACID Transactions)',
    architecture: 'Full-Stack Separated (Backend API + Frontend SPA)',
    timestamp: new Date().toISOString()
  });
});
