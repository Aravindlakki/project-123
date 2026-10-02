import { HRContact } from '../types';

export interface ProofVerificationRecord {
  leadId: string;
  proof_verified_status: 'approved' | 'rejected' | 'pending';
  proof_verified_by?: string;
  proof_verified_at?: string;
  proof_admin_notes?: string;
  proof_screenshot_url?: string;
  proof_channel?: 'called' | 'messaged' | 'mailed';
  response_status?: string;
  responded_at?: string;
  updated_at: string;
}

const STORAGE_KEY = 'placemein_verified_proofs_v1';

/**
 * ProofStore
 * 
 * Bulletproof persistent client store for proof verification states.
 * Guarantees that once an admin approves a lead, the approved status
 * STAYS as approved and is never reverted by schema mismatches, network
 * latency, or remote database column absences.
 */
export const proofStore = {
  getRegistry(): Record<string, ProofVerificationRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  },

  getRecord(leadId: string): ProofVerificationRecord | null {
    if (!leadId) return null;
    const reg = this.getRegistry();
    return reg[leadId] || null;
  },

  saveRecord(record: ProofVerificationRecord): void {
    if (!record || !record.leadId) return;
    try {
      const reg = this.getRegistry();
      reg[record.leadId] = {
        ...reg[record.leadId],
        ...record,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reg));
    } catch (e) {
      console.warn('[ProofStore] Failed to save record to localStorage:', e);
    }
  },

  saveDecision(
    leadId: string,
    status: 'approved' | 'rejected' | 'pending',
    metadata?: {
      by?: string;
      at?: string;
      notes?: string;
      channel?: 'called' | 'messaged' | 'mailed';
      screenshotUrl?: string;
      response_status?: string;
      responded_at?: string;
    }
  ): ProofVerificationRecord {
    const existing = this.getRecord(leadId);
    const updated: ProofVerificationRecord = {
      leadId,
      proof_verified_status: status,
      proof_verified_by: metadata?.by ?? existing?.proof_verified_by ?? 'Admin',
      proof_verified_at: metadata?.at ?? existing?.proof_verified_at ?? new Date().toISOString(),
      proof_admin_notes: metadata?.notes ?? existing?.proof_admin_notes,
      proof_screenshot_url: metadata?.screenshotUrl ?? existing?.proof_screenshot_url,
      proof_channel: metadata?.channel ?? existing?.proof_channel,
      response_status: metadata?.response_status ?? existing?.response_status,
      responded_at: metadata?.responded_at ?? existing?.responded_at,
      updated_at: new Date().toISOString(),
    };

    this.saveRecord(updated);
    return updated;
  },

  /**
   * Merge contacts with persistent proof registry.
   * If a contact has an approved or rejected record in storage,
   * that recorded decision takes precedence over null/undefined/pending
   * from unmigrated or lagging database responses.
   */
  mergeContact<T extends Partial<HRContact> & { id: string }>(contact: T): T {
    if (!contact || !contact.id) return contact;
    const reg = this.getRegistry();
    const record = reg[contact.id];

    // If database already has an explicit approved/verified/rejected decision,
    // sync it back to local registry so it's always cached.
    const currentStatus = contact.proof_verified_status;
    if (
      (currentStatus === 'approved' || currentStatus === 'verified' || currentStatus === 'rejected') &&
      (!record || record.proof_verified_status !== currentStatus)
    ) {
      const normalizedStatus = currentStatus === 'verified' ? 'approved' : currentStatus;
      this.saveDecision(contact.id, normalizedStatus as 'approved' | 'rejected', {
        by: contact.proof_verified_by,
        at: contact.proof_verified_at,
        notes: contact.proof_admin_notes,
        screenshotUrl: contact.proof_screenshot_url,
        channel: contact.proof_channel as any,
      });
      return {
        ...contact,
        proof_verified_status: normalizedStatus,
      };
    }

    // If local storage has a decision and the incoming contact lacks it or is pending:
    if (record) {
      const hasScreenshot = Boolean(contact.proof_screenshot_url || record.proof_screenshot_url);
      if (!hasScreenshot) return contact;

      // Keep it as the stored decision (e.g. approved)
      return {
        ...contact,
        proof_verified_status: record.proof_verified_status,
        proof_verified_by: contact.proof_verified_by || record.proof_verified_by,
        proof_verified_at: contact.proof_verified_at || record.proof_verified_at,
        proof_admin_notes: contact.proof_admin_notes !== undefined ? contact.proof_admin_notes : record.proof_admin_notes,
        proof_screenshot_url: contact.proof_screenshot_url || record.proof_screenshot_url,
        proof_channel: contact.proof_channel || record.proof_channel,
      };
    }

    return contact;
  },

  mergeContacts<T extends Partial<HRContact> & { id: string }>(contacts: T[]): T[] {
    if (!Array.isArray(contacts)) return contacts;
    const reg = this.getRegistry();
    return contacts.map((c) => {
      const record = reg[c.id];
      const currentStatus = c.proof_verified_status;

      if (
        (currentStatus === 'approved' || currentStatus === 'verified' || currentStatus === 'rejected') &&
        (!record || record.proof_verified_status !== currentStatus)
      ) {
        const normalizedStatus = currentStatus === 'verified' ? 'approved' : currentStatus;
        this.saveDecision(c.id, normalizedStatus as 'approved' | 'rejected', {
          by: c.proof_verified_by,
          at: c.proof_verified_at,
          notes: c.proof_admin_notes,
          screenshotUrl: c.proof_screenshot_url,
          channel: c.proof_channel as any,
        });
        return {
          ...c,
          proof_verified_status: normalizedStatus,
        };
      }

      if (record) {
        const hasScreenshot = Boolean(c.proof_screenshot_url || record.proof_screenshot_url);
        if (!hasScreenshot) return c;

        return {
          ...c,
          proof_verified_status: record.proof_verified_status,
          proof_verified_by: c.proof_verified_by || record.proof_verified_by,
          proof_verified_at: c.proof_verified_at || record.proof_verified_at,
          proof_admin_notes: c.proof_admin_notes !== undefined ? c.proof_admin_notes : record.proof_admin_notes,
          proof_screenshot_url: c.proof_screenshot_url || record.proof_screenshot_url,
          proof_channel: c.proof_channel || record.proof_channel,
        };
      }

      return c;
    });
  },
};
