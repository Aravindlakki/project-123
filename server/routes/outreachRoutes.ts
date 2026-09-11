import { Router } from 'express';
import {
  getOutreach,
  createOutreach,
  updateOutreachStatus,
  uploadProof,
  getProofImage,
  draftMessage,
  analyzeProfile,
  bulkDraftMessage,
  bulkStatus,
  getOutcomeByContactId,
  updateOutcomeByContactId,
} from '../controllers/outreachController';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadFile } from '../middlewares/uploadMiddleware';

export const outreachRouter = Router();

outreachRouter.get('/outreach', authenticate, getOutreach);
outreachRouter.post('/outreach', authenticate, createOutreach);
outreachRouter.patch('/outreach/:id/status', authenticate, updateOutreachStatus);
outreachRouter.post('/outreach/:id/upload-proof', authenticate, uploadFile, uploadProof);
outreachRouter.get('/outreach/:id/proof-image', getProofImage);
outreachRouter.post('/outreach/draft-message', authenticate, draftMessage);
outreachRouter.post('/outreach/analyze-profile', authenticate, analyzeProfile);
outreachRouter.post('/outreach/bulk-draft-message', authenticate, bulkDraftMessage);
outreachRouter.post('/outreach/bulk-status', authenticate, bulkStatus);
outreachRouter.get('/outreach/outcome/:contactId', authenticate, getOutcomeByContactId);
outreachRouter.patch('/outreach/outcome/:contactId', authenticate, updateOutcomeByContactId);
