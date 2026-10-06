import { Router } from 'express';
import {
  getCompanies,
  createCompany,
  bulkCompanies,
  uploadCSVCompanies,
  parseDocumentHR,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyLinkedRecords,
} from '../controllers/companyController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { uploadFile } from '../middlewares/uploadMiddleware';

export const companyRouter = Router();

companyRouter.get('/companies', authenticate, getCompanies);
companyRouter.post('/companies', authenticate, createCompany);
companyRouter.post('/companies/bulk', authenticate, bulkCompanies);
companyRouter.post('/companies/upload-csv', authenticate, uploadFile, uploadCSVCompanies);
companyRouter.post('/companies/parse-document-hr', authenticate, uploadFile, parseDocumentHR);
companyRouter.get('/companies/:id', authenticate, getCompanyById);
companyRouter.get('/companies/:id/linked-records', authenticate, requireAdmin, getCompanyLinkedRecords);
companyRouter.patch('/companies/:id', authenticate, requireAdmin, updateCompany);
companyRouter.put('/companies/:id', authenticate, requireAdmin, updateCompany);
companyRouter.delete('/companies/:id', authenticate, requireAdmin, deleteCompany);
