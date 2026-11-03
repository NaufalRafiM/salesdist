import { Router } from 'express';
import { adminController } from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.get('/dashboard', adminController.getDashboard);
adminRouter.get('/reports/pending', adminController.getPendingReports);
adminRouter.post('/reports/:id/verify', adminController.verifyReport);
adminRouter.get('/finance', adminController.getFinancialRecap);
adminRouter.get('/finance/export-csv', adminController.exportFinancialCsv);
adminRouter.get('/stock', adminController.getStockInventory);
adminRouter.put('/stock/:id', adminController.updateStock);
adminRouter.get('/pic-verifications', adminController.getPicVerifications);
adminRouter.post('/pic-verifications/:id', adminController.verifyPic);
