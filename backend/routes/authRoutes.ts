import { Router } from 'express';
import { authController } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/register-pic', authController.registerPic);
authRouter.get('/status-lookup', authController.lookupStatus);
authRouter.get('/me', authController.getMe);
