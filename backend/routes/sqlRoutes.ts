import { Router } from 'express';
import { sqlController } from '../controllers/sqlController';

export const sqlRouter = Router();

sqlRouter.get('/schema', sqlController.getSchema);
sqlRouter.post('/query', sqlController.executeQuery);
