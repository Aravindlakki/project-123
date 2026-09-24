import { Router } from 'express';
import {
  getWorksheetLeads,
  createWorksheetLead,
  bulkCreateWorksheetLeads,
} from '../controllers/worksheetController';
import { authenticate } from '../middlewares/authMiddleware';

export const worksheetRouter = Router();

worksheetRouter.get('/worksheet/leads', authenticate, getWorksheetLeads);
worksheetRouter.post('/worksheet/lead', authenticate, createWorksheetLead);
worksheetRouter.post('/worksheet/bulk-leads', authenticate, bulkCreateWorksheetLeads);
worksheetRouter.post('/worksheets/leads/bulk', authenticate, bulkCreateWorksheetLeads);
