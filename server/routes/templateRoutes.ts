import { Router } from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDraft,
  trackOutreach,
} from '../controllers/templateController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

export const templateRouter = Router();

// Message templates listing (authenticated)
templateRouter.get('/message-templates', authenticate, getTemplates);

// Message template management (Admin only)
templateRouter.post('/message-templates', authenticate, requireAdmin, createTemplate);
templateRouter.patch('/message-templates/:id', authenticate, requireAdmin, updateTemplate);
templateRouter.delete('/message-templates/:id', authenticate, requireAdmin, deleteTemplate);

// Draft generation for leads & copy-paste actions (authenticated employees)
templateRouter.post('/message-templates/generate', authenticate, generateDraft);

// Tracking outreach usage & proof prompt handoff
templateRouter.post('/message-templates/track-outreach', authenticate, trackOutreach);
