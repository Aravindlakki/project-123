-- CRM — ROLLBACK: PROOF OF CONTACT VERIFICATION FIELDS
-- Reverses 20260930_proof_verification.sql

DROP INDEX IF EXISTS idx_contacts_proof_pending;

ALTER TABLE contacts
  DROP COLUMN IF EXISTS proof_channel,
  DROP COLUMN IF EXISTS proof_verified_status,
  DROP COLUMN IF EXISTS proof_verified_by,
  DROP COLUMN IF EXISTS proof_verified_at,
  DROP COLUMN IF EXISTS proof_admin_notes;
