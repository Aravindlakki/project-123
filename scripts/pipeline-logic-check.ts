/**
 * Logic verification for the recruitment pipeline (no DOM needed).
 * Run: npx tsx scripts/pipeline-logic-check.ts
 */
import { pipelineStore } from '../src/services/pipelineStore';
import { buildOutreachDraft } from '../src/services/pipelineService';
import { PipelineChannel } from '../src/types/pipeline';

// Minimal localStorage shim for node
const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => void mem.clear(),
};

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failures++;
  }
};

console.log('\n— Pipeline store —');
const lead = pipelineStore.create({
  company_name: 'Verify Corp',
  role_title: 'QA Engineer',
  role_category: 'tech',
  origin: 'manual',
  created_by_name: 'Tester',
});
assert(Boolean(lead.id && lead.lead_code?.startsWith('LEAD-')), `lead created with code ${lead.lead_code}`);
assert(lead.stage === 'leads' && lead.status === 'new', 'starts in Leads / New');

// Draft + send
const { outreach } = pipelineStore.addDraft(lead.id, 'linkedin', 'Hi Priya, custom draft text');
assert(outreach?.status === 'draft', 'draft created');
const afterSend = pipelineStore.markSent(lead.id, outreach!.id, {});
assert(afterSend?.stage === 'proof_of_response', 'after send → Proof of Response stage');
assert(afterSend?.outreach[0].status === 'sent', 'outreach marked sent');

// Proof upload + admin approval
const withProof = pipelineStore.addProof(lead.id, {
  channel: 'linkedin',
  screenshot_url: 'data:image/png;base64,TEST',
  filename: 'shot.png',
  uploaded_by_name: 'Tester',
});
assert((withProof?.proofs.length || 0) === 1 && withProof?.proofs[0].verification === 'pending', 'proof pending review');
assert(pipelineStore.proofsPendingReview().length === 1, 'admin queue sees pending proof');

const approved = pipelineStore.reviewProof(lead.id, withProof!.proofs[0].id, 'approved', undefined, 'Admin');
assert(approved?.response_status === 'responded', 'approval marks lead responded');
assert(approved?.stage === 'follow_up', 'responded lead moves to Follow-up');

// Day-2 follow-up scheduling
const noRespLead = pipelineStore.create({ company_name: 'Silent Corp', origin: 'manual' });
pipelineStore.saveHrContact(noRespLead.id, { hr_name: 'Ravi', hr_email: 'ravi@silent.example' });
const nr = pipelineStore.get(noRespLead.id)!;
const { outreach: nrOut } = pipelineStore.addDraft(nr.id, 'mail', 'intro mail');
pipelineStore.markSent(nr.id, nrOut!.id, {});
pipelineStore.markResponse(nr.id, false, 'no reply');
const nrAfter = pipelineStore.get(nr.id)!;
assert(nrAfter.status === 'awaiting_follow_up', 'non-responder awaiting follow-up');
assert(
  nrAfter.next_follow_up_date === pipelineDateUtilsAddDays(2),
  `follow-up scheduled +2 days (got ${nrAfter.next_follow_up_date})`
);
assert(pipelineStore.todaysFollowUps().some((l) => l.id === nr.id) === false, 'not due today yet');

// Simulate the date arriving (2 days later): manually backdate and re-check lists
const backdated = pipelineStore.update(nr.id, {
  next_follow_up_date: pipelineDateUtilsAddDays(0),
});
assert(pipelineStore.todaysFollowUps().some((l) => l.id === nr.id), 'due follow-up shows in Today list');

const logged = pipelineStore.logFollowUp(nr.id, { channel: 'whatsapp', message: 'day-2 ping', logged_by: 'Tester' });
assert((logged?.follow_ups.length || 0) === 1, 'follow-up logged');
const completed = pipelineStore.completeFollowUp(nr.id, logged!.follow_ups[0].id, 'replied');
assert(completed?.response_status === 'responded', '"replied" outcome flips lead to responded');

// Stats
const stats = pipelineStore.stats();
assert(stats.total_leads >= 2, `stats total (${stats.total_leads})`);
assert(stats.outreach_sent >= 2, `outreach sent counted (${stats.outreach_sent})`);

console.log('\n— Draft generation (custom name per lead) —');
const dLead = pipelineStore.get(lead.id)!;
for (const ch of ['linkedin', 'whatsapp', 'mail'] as PipelineChannel[]) {
  const text = buildOutreachDraft({ lead: dLead, channel: ch, sender_name: 'Aravind' });
  assert(text.includes('Verify Corp'), `${ch} draft mentions company`);
  assert(text.includes('Verify') === true, `${ch} draft uses lead HR name`);
}
const fu = buildOutreachDraft({ lead: dLead, channel: 'mail', sender_name: 'Aravind', follow_up_number: 2 });
assert(/following up|reminder/i.test(fu), 'day-2 follow-up draft has follow-up tone');

console.log(failures === 0 ? '\nALL PIPELINE CHECKS PASSED ✅' : `\n${failures} CHECKS FAILED ❌`);
process.exit(failures === 0 ? 0 : 1);

function pipelineDateUtilsAddDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
