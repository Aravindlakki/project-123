-- CRM — PROOF OF CONTACT VERIFICATION FIELDS
-- Adds admin verification columns for mandatory proof-of-response screenshots.
-- When a CRA logs a response (interested / asked JD / call scheduled / etc.),
-- they must upload a screenshot (call log / message / mail). The lead only
-- "counts" once an Admin sets proof_verified_status = 'verified'.
-- Run the rollback script to remove these columns.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS proof_channel TEXT
    CHECK (proof_channel IN ('called', 'messaged', 'mailed')),
  ADD COLUMN IF NOT EXISTS proof_verified_status TEXT
    DEFAULT 'pending'
    CHECK (proof_verified_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS proof_verified_by UUID REFERENCES public.cras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proof_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_admin_notes TEXT;

-- Existing rows that already carry a screenshot are waiting for review.
UPDATE contacts
SET proof_verified_status = 'pending'
WHERE proof_screenshot_url IS NOT NULL
  AND proof_screenshot_url <> ''
  AND proof_verified_status IS NULL;

-- Helpful index for the admin review queue
CREATE INDEX IF NOT EXISTS idx_contacts_proof_pending
  ON contacts (proof_verified_status)
  WHERE proof_verified_status = 'pending';
