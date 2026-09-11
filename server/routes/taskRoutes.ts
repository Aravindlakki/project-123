import { Router } from 'express';
import { getTasks, createTask, updateTaskStatus, deleteTask } from '../controllers/taskController';
import { authenticate } from '../middlewares/authMiddleware';

export const taskRouter = Router();

taskRouter.get('/tasks', authenticate, getTasks);
taskRouter.post('/tasks', authenticate, createTask);
taskRouter.patch('/tasks/:id/status', authenticate, updateTaskStatus);
taskRouter.delete('/tasks/:id', authenticate, deleteTask);
