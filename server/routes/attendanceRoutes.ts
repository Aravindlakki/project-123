import { Router } from 'express';
import {
  getAttendanceToday,
  getAttendanceHistory,
  checkIn,
  checkOut,
  getWorkSummary,
  getCraWorkSummary,
} from '../controllers/attendanceController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

export const attendanceRouter = Router();

attendanceRouter.get('/attendance/today', authenticate, getAttendanceToday);
attendanceRouter.get('/attendance/history', authenticate, getAttendanceHistory);
attendanceRouter.post('/attendance/check-in', authenticate, checkIn);
attendanceRouter.post('/attendance/check-out', authenticate, checkOut);
attendanceRouter.get('/attendance/work-summary', authenticate, getWorkSummary);
attendanceRouter.get('/attendance/cra-work-summary/:craId', authenticate, requireAdmin, getCraWorkSummary);
