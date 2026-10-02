-- ==============================================================================
-- CRM - PART A ROLLBACK: WORKSHEET RESPONSE FIELDS
-- File: supabase/migrations/20260929_worksheet_response_fields_rollback.sql
-- Exact inverse of 20260929_worksheet_response_fields.sql
-- ==============================================================================

DROP INDEX IF EXISTS idx_contacts_response_status;

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_response_status_check;

ALTER TABLE public.contacts
  DROP COLUMN IF EXISTS response_status,
  DROP COLUMN IF EXISTS response_note,
  DROP COLUMN IF EXISTS responded_at;
