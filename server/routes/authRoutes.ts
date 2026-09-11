import { Router } from 'express';
import {
  login,
  register,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/auth/login', login);
authRouter.post('/auth/register', register);
authRouter.post('/auth/logout', authenticate, logout);
authRouter.get('/auth/me', authenticate, getMe);
authRouter.post('/auth/forgot-password', forgotPassword);
authRouter.post('/auth/reset-password', resetPassword);
authRouter.post('/auth/change-password', authenticate, changePassword);
