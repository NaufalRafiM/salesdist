import express from 'express';
import { apiRouter } from './routes';
import { initializeDatabase } from './db/init';

export const backendApp = express();

// Middlewares
backendApp.use(express.json({ limit: '15mb' }));
backendApp.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API routes
backendApp.use('/api', apiRouter);

export { initializeDatabase };
export default backendApp;
