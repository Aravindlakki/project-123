import { Router } from 'express';
import { getUsers, updateUserTarget } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

export const userRouter = Router();

userRouter.get('/users', authenticate, getUsers);
userRouter.patch('/users/:id/target', authenticate, requireAdmin, updateUserTarget);
