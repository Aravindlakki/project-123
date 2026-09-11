import { Router } from 'express';
import {
  getCompanies,
  createCompany,
  bulkCompanies,
  parseDocumentHR,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadFile } from '../middlewares/uploadMiddleware';

export const companyRouter = Router();

companyRouter.get('/companies', authenticate, getCompanies);
companyRouter.post('/companies', authenticate, createCompany);
companyRouter.post('/companies/bulk', authenticate, bulkCompanies);
companyRouter.post('/companies/parse-document-hr', authenticate, uploadFile, parseDocumentHR);
companyRouter.get('/companies/:id', authenticate, getCompanyById);
companyRouter.patch('/companies/:id', authenticate, updateCompany);
companyRouter.delete('/companies/:id', authenticate, deleteCompany);
