import { Router } from 'express';
import {
  getContacts,
  createContact,
  enrichContactFromApollo,
  manualLinkedIn,
  searchHRGoogle,
  autofillFromGoogle,
  bulkContacts,
  getContactById,
  updateContact,
  deleteContact,
} from '../controllers/contactController';
import { authenticate } from '../middlewares/authMiddleware';

export const contactRouter = Router();

contactRouter.get('/contacts', authenticate, getContacts);
contactRouter.post('/contacts', authenticate, createContact);
contactRouter.post('/contacts/enrich', authenticate, enrichContactFromApollo);
contactRouter.post('/contacts/manual-linkedin', authenticate, manualLinkedIn);
contactRouter.all('/contacts/search-hr-google', authenticate, searchHRGoogle);
contactRouter.post('/contacts/autofill-from-google', authenticate, autofillFromGoogle);
contactRouter.post('/contacts/bulk', authenticate, bulkContacts);
contactRouter.get('/contacts/:id', authenticate, getContactById);
contactRouter.patch('/contacts/:id', authenticate, updateContact);
contactRouter.delete('/contacts/:id', authenticate, deleteContact);
