-- ==============================================================================
-- CRM - PART A: WORKSHEET RESPONSE FIELDS MIGRATION
-- File: supabase/migrations/20260929_worksheet_response_fields.sql
-- Run this in your Supabase SQL Editor.
--
-- Adds response tracking to worksheet leads (contacts table):
--   response_status  - dropdown value chosen by the CRA after contacting the HR
--   response_note    - optional free-text note accompanying the response
--   responded_at     - auto timestamp set whenever a non-default response is chosen
--
-- Idempotent: safe to run multiple times. Existing rows keep their data
-- (default response_status 'no_response_yet', NULL note/timestamp).
-- ==============================================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS response_status text NOT NULL DEFAULT 'no_response_yet';

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS response_note text;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

-- Guard against unexpected values at the database level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_response_status_check'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_response_status_check
      CHECK (response_status IN (
        'no_response_yet',
        'replied_interested',
        'replied_asked_jd',
        'replied_not_interested',
        'call_scheduled',
        'wrong_contact'
      ));
  END IF;
END $$;

-- Filter helper for the Response filter dropdown
CREATE INDEX IF NOT EXISTS idx_contacts_response_status
  ON public.contacts (response_status);

COMMENT ON COLUMN public.contacts.response_status IS
  'My Worksheet response dropdown: no_response_yet | replied_interested | replied_asked_jd | replied_not_interested | call_scheduled | wrong_contact';
COMMENT ON COLUMN public.contacts.responded_at IS
  'Auto-set timestamp (IST client clock) when a non-default response is chosen. Reset to NULL when response returns to no_response_yet.';

-- ==============================================================================
-- ROLLBACK (supabase/migrations/20260929_worksheet_response_fields_rollback.sql)
-- ==============================================================================
-- DROP INDEX IF EXISTS idx_contacts_response_status;
-- ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_response_status_check;
-- ALTER TABLE public.contacts
--   DROP COLUMN IF EXISTS response_status,
--   DROP COLUMN IF EXISTS response_note,
--   DROP COLUMN IF EXISTS responded_at;
