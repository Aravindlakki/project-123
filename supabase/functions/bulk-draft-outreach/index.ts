import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuthAndRateLimit, logAiUsage, corsHeaders } from '../_shared/auth.ts';

async function callGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      continue;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Verify caller identity via JWT and check rate limit (5 bulk batches / day, max 60 total calls across all tools)
  const { errorResponse, auth } = await verifyAuthAndRateLimit(req, 'bulk-draft-outreach', 5);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const rawContactIds: string[] = body.contact_ids || [];
    // Strict safety cap: max 5 contacts per bulk run to preserve Gemini free-tier quota
    const contactIds = rawContactIds.slice(0, 5);
    const channel = body.channel || 'mail';
    const contactsData: Array<{ id: string; name: string; company_name?: string }> = body.contacts || [];

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new Error('contact_ids array is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const drafts: Record<string, string> = {};

    // Generate tailored drafts
    for (const cid of contactIds) {
      const info = contactsData.find((c) => c.id === cid);
      const contactName = info?.name || 'Hiring Lead';
      const companyName = info?.company_name || 'your team';

      if (apiKey) {
        const prompt = `You are a Corporate Relations Associate (CRA) at Placemein, an Indian recruitment and student talent placement partnership organization.
Draft a brief, professional outreach message for:
- Contact: ${contactName}
- Company: ${companyName}
- Channel: ${channel} (e.g. Call script, LinkedIn message, WhatsApp text, or Email)
Focus: Placement partnerships for pre-screened graduating engineers (Full-Stack, Data, AI).
Return ONLY the raw draft message text, with no preamble.`;

        const text = await callGemini(prompt, apiKey);
        if (text) {
          drafts[cid] = text.trim();
          continue;
        }
      }

      // High-quality contextual fallback template
      if (channel === 'call') {
        drafts[cid] = `Hello ${contactName}, this is calling from Placemein Campus Relations regarding technical hiring partnerships at ${companyName}. Do you have 2 minutes to discuss our pre-vetted campus candidates?`;
      } else if (channel === 'linkedin') {
        drafts[cid] = `Hi ${contactName}, noticed your team's expansion at ${companyName}. At Placemein, we connect growing tech teams with pre-screened fresh graduates across Tech & Data domains. Would love to share our candidate roster!`;
      } else if (channel === 'whatsapp' || channel === 'text') {
        drafts[cid] = `Hi ${contactName} 👋 Following up from Placemein regarding talent opportunities at ${companyName}. We have vetted candidates ready for immediate interviews. Open to receiving a 1-page summary?`;
      } else {
        drafts[cid] = `Subject: Placemein Candidate Pipeline for ${companyName}\n\nDear ${contactName},\n\nHope this finds you well. Reaching out from Placemein regarding ${companyName}'s hiring plans. We have highly skilled engineering candidates ready for technical evaluations.\n\nBest regards,\nPlacemein CRA Team`;
      }
    }

    if (auth?.user) {
      await logAiUsage(auth.supabase, auth.user.id, 'bulk-draft-outreach', {
        channel,
        contact_count: contactIds.length,
      });
    }

    return new Response(JSON.stringify({ channel, drafts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Bulk draft generation failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
