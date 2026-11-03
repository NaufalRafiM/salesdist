import express from 'express';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './backend/routes';
import { initializeDatabase } from './backend/db/init';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database schema and seed data
  console.log('[SALESDIST Backend] Initializing SQL Relational Database...');
  initializeDatabase();

  // Middleware for parsing JSON with ample limit for biometric & transfer images
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Mount Backend API routes
  app.use('/api', apiRouter);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Explicitly disable HMR to prevent port 24678 conflicts
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SALESDIST Server] Full-Stack application running on http://0.0.0.0:${PORT}`);
    console.log(`[SALESDIST Server] Backend API mounted at http://0.0.0.0:${PORT}/api`);
    console.log(`[SALESDIST Server] Frontend SPA active`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[SALESDIST Server] Port ${PORT} is already in use. Retrying or shutting down cleanly.`);
    } else {
      console.error('[SALESDIST Server] Server error:', err);
    }
  });

  const cleanup = () => {
    console.log('[SALESDIST Server] Gracefully closing HTTP server...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer().catch((err) => {
  console.error('[SALESDIST Server] Failed to start server:', err);
  process.exit(1);
});
