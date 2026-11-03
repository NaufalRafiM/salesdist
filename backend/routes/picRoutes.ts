import { Router } from 'express';
import { picController } from '../controllers/picController';

export const picRouter = Router();

picRouter.get('/dashboard', picController.getDashboard);
picRouter.get('/reports', picController.getReports);
picRouter.post('/reports', picController.submitReport);
picRouter.put('/reports/:id/revise', picController.reviseReport);
picRouter.get('/notifications', picController.getNotifications);
picRouter.put('/notifications/:id/read', picController.markNotificationRead);
