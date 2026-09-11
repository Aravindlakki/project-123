import { Router } from 'express';
import { getDashboardStats, getCRAPerformance } from '../controllers/dashboardController';
import { authenticate } from '../middlewares/authMiddleware';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard/stats', authenticate, getDashboardStats);
dashboardRouter.get('/dashboard/cra-performance', authenticate, getCRAPerformance);
