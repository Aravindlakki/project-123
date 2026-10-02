-- Migration: Worksheet Response Tracking & Proof Verification Fields
-- Idempotent script for Supabase SQL Editor

-- 1. Response tracking fields
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS response_status text NOT NULL DEFAULT 'no_response_yet';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS response_note text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS responded_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_response_status_check') THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_response_status_check
      CHECK (response_status IN ('no_response_yet','replied_interested','replied_asked_jd','replied_not_interested','call_scheduled','wrong_contact'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_response_status ON public.contacts (response_status);

-- 2. Proof verification fields
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS proof_channel TEXT,
  ADD COLUMN IF NOT EXISTS proof_screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_screenshot_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_verified_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS proof_verified_by TEXT,
  ADD COLUMN IF NOT EXISTS proof_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_admin_notes TEXT;

UPDATE public.contacts SET proof_verified_status = 'pending'
WHERE proof_screenshot_url IS NOT NULL AND proof_screenshot_url <> '' AND proof_verified_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_proof_pending ON public.contacts (proof_verified_status) WHERE proof_verified_status = 'pending';
