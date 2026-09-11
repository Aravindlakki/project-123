import { Router } from 'express';
import { getWorksheetLeads, createWorksheetLead } from '../controllers/worksheetController';
import { authenticate } from '../middlewares/authMiddleware';

export const worksheetRouter = Router();

worksheetRouter.get('/worksheet/leads', authenticate, getWorksheetLeads);
worksheetRouter.post('/worksheet/lead', authenticate, createWorksheetLead);
