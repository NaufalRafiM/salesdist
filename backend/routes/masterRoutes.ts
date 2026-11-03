import { Router } from 'express';
import { masterController } from '../controllers/masterController';

export const masterRouter = Router();

// Brands
masterRouter.get('/brands', masterController.getBrands);
masterRouter.post('/brands', masterController.createBrand);
masterRouter.put('/brands/:id', masterController.updateBrand);
masterRouter.delete('/brands/:id', masterController.deleteBrand);

// Areas
masterRouter.get('/areas', masterController.getAreas);
masterRouter.post('/areas', masterController.createArea);
masterRouter.put('/areas/:id', masterController.updateArea);
masterRouter.delete('/areas/:id', masterController.deleteArea);

// Warehouses
masterRouter.get('/warehouses', masterController.getWarehouses);
masterRouter.post('/warehouses', masterController.createWarehouse);
masterRouter.put('/warehouses/:id', masterController.updateWarehouse);
masterRouter.delete('/warehouses/:id', masterController.deleteWarehouse);

// Users
masterRouter.get('/users', masterController.getUsers);
masterRouter.post('/users', masterController.createUser);
masterRouter.delete('/users/:id', masterController.deleteUser);
