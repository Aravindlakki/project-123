import { Router } from 'express';
import { getLeaves, applyLeave, reviewLeave } from '../controllers/leaveController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

export const leaveRouter = Router();

leaveRouter.get('/leaves', authenticate, getLeaves);
leaveRouter.post('/leaves', authenticate, applyLeave);
leaveRouter.patch('/leaves/:id/review', authenticate, requireAdmin, reviewLeave);
