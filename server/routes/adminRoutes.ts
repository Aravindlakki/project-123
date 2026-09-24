import { Router } from 'express';
import {
  getAuditLogs,
  exportCSV,
  getSettings,
  updateSettings,
  updateSystemSettings,
  getAdminJDs,
  getAdminUnverifiedJDs,
  verifyAdminJD,
  getAdminUsers,
  createTeamMember,
  updateAdminUser,
  toggleUserStatus,
  resetUserPassword,
  updateUserRole,
  deleteUser,
  seedSheetLeadExport,
  resetData,
  uploadCsvLeads,
  uploadPdfLeads,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { uploadFile } from '../middlewares/uploadMiddleware';

export const adminRouter = Router();

adminRouter.get('/admin/jds', authenticate, requireAdmin, getAdminJDs);
adminRouter.get('/admin/jds/unverified', authenticate, requireAdmin, getAdminUnverifiedJDs);
adminRouter.patch('/admin/jds/:jdId/verify', authenticate, requireAdmin, verifyAdminJD);
adminRouter.get('/admin/system/settings', authenticate, requireAdmin, getSettings);
adminRouter.patch('/admin/system/settings', authenticate, requireAdmin, updateSystemSettings);

adminRouter.get('/admin/audit-logs', authenticate, requireAdmin, getAuditLogs);
adminRouter.get('/admin/export', authenticate, requireAdmin, exportCSV);
adminRouter.get('/admin/settings', authenticate, requireAdmin, getSettings);
adminRouter.put('/admin/settings', authenticate, requireAdmin, updateSettings);

// Team Member & User Management (CRUD)
adminRouter.get('/admin/users', authenticate, requireAdmin, getAdminUsers);
adminRouter.post('/admin/users', authenticate, requireAdmin, createTeamMember);
adminRouter.patch('/admin/users/:id', authenticate, requireAdmin, updateAdminUser);
adminRouter.delete('/admin/users/:id', authenticate, requireAdmin, deleteUser);
adminRouter.patch('/admin/users/:id/toggle-status', authenticate, requireAdmin, toggleUserStatus);

adminRouter.post('/admin/team-members', authenticate, requireAdmin, createTeamMember);
adminRouter.patch('/admin/team-members/:id/toggle-status', authenticate, requireAdmin, toggleUserStatus);
adminRouter.post('/admin/team-members/:id/reset-password', authenticate, requireAdmin, resetUserPassword);
adminRouter.patch('/admin/team-members/:id/role', authenticate, requireAdmin, updateUserRole);
adminRouter.delete('/admin/team-members/:id', authenticate, requireAdmin, deleteUser);
adminRouter.get('/admin/seed-sheet-lead-export', authenticate, seedSheetLeadExport);
adminRouter.post('/admin/reset-data', authenticate, requireAdmin, resetData);
adminRouter.post('/admin/upload-csv-leads', authenticate, uploadFile, uploadCsvLeads);
adminRouter.post('/admin/upload-pdf-leads', authenticate, uploadFile, uploadPdfLeads);

