import { Router } from 'express';
import {
  getJDs,
  createJD,
  extractFromFile,
  getExtractionStatus,
  getJDById,
  updateJD,
  deleteJD,
} from '../controllers/jdController';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadFile } from '../middlewares/uploadMiddleware';

export const jdRouter = Router();

jdRouter.get('/jds', authenticate, getJDs);
jdRouter.post('/jds', authenticate, createJD);
jdRouter.post('/jds/extract-from-file', authenticate, uploadFile, extractFromFile);
jdRouter.get('/jds/extraction-status', authenticate, getExtractionStatus);
jdRouter.get('/jds/:id', authenticate, getJDById);
jdRouter.patch('/jds/:id', authenticate, updateJD);
jdRouter.delete('/jds/:id', authenticate, deleteJD);
