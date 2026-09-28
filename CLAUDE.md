# CLAUDE.md - Placemein CRM

## Architecture Map
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (`src/`)
  - Core: `src/App.tsx`, Pages: `src/pages/`, Components: `src/components/`, Services: `src/services/`
  - Dual Portals: Employee Portal (`/dashboard`, `/crm`, `/jd-intake`, etc.) & Admin Leadership Portal (`/admin/*`)
- **Backend**: Express + TypeScript (`server/`, entry: `server.ts`, port 3001)
  - Routes (`server/routes/` mounted at `/api/v1`), Controllers (`server/controllers/`), Middleware (`server/middlewares/`)
  - In-memory store (`server/models/db.ts`) with Google Gemini AI integration (`server/services/geminiService.ts`)
- **Database & Services**: Supabase PostgreSQL with RLS (`supabase/schema.sql`, `supabase/rls.sql`)
  - Core Tables: `profiles`, `companies`, `contacts`, `jds`, `campaigns`, `outreach_records`, `outreach_proofs`, `tasks`, `leaves`, `attendance`
- **Deployments**: Vercel (Frontend SPA via `vercel.json`), Render (Backend via `render.yaml`), GitHub Pages (`.github/workflows/deploy.yml`)

## RBAC & Auth Rules
- **Roles**: Strictly `'cra'` (Employee) and `'admin'` (Leadership).
- **Authentication**: JWT issued upon login (`/api/v1/auth/login`) and validated via `authenticate` middleware; elevated operations require `requireAdmin`.
- **Portal Visibility & Data Scope**:
  - Internal-only team tool; all authenticated team members have read visibility across shared CRM companies, contacts, and campaigns.
  - Admin Portal is protected by server role verification and client-side elevation challenge (`sessionStorage: placemein:admin_verified`).
- **Server Enforcement**: All destructive actions, company edits, user management, and JD verifications must be strictly enforced on the server via `requireAdmin`.

## Security Findings
- **Token Verification Fallback**: `server/middlewares/authMiddleware.ts` previously fell back to an active admin user on invalid tokens. Must strictly fail with `401 Unauthorized`.
- **Missing Server RBAC Guards**: Endpoints in `server/routes/adminRoutes.ts` (lead imports), `server/routes/companyRoutes.ts` (`PATCH`/`DELETE`), and `server/routes/leaveRoutes.ts` lacked `requireAdmin`.
- **Committed Credentials & Real Contact Data**: Static credentials and real contact records in `src/data/`, `app/applet/src/data/`, and `data/sample_lead_export.csv` must be replaced with environment variables and synthetic fixtures.
- **JWT Secret**: Disallow static fallback secrets in production; require `JWT_SECRET` via environment configuration.

## Planned Changes
1. **JD Intake & Admin Approval**: JD intake goes to admin approval; approved JDs are stored and counted for that employee, rejected ones are "not eligible" and not counted.
2. **Admin-Only Lead & Company Edits**: Only admins can edit leads and companies; employees request edits through the admin.
3. **In-Leads Outreach Logging**: In Leads, marking a lead "connected" requires a screenshot upload and logs the outreach there; the separate Outreach Tracker page is removed from navigation.
4. **Live Employee Session Timer**: Employee dashboard has a live login-to-logout timer that never interrupts sourcing.
5. **Master Company Import & CRA Salary Calculation**: Master company list bulk import (admin only) and CRA salary calculation based on converted/acquired JDs.
