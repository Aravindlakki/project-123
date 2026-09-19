import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAuthAndRateLimit, logAiUsage, corsHeaders } from '../_shared/auth.ts'

async function callGemini(prompt: string | object, apiKey: string): Promise<{text: string | null, modelUsed: string}> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = typeof prompt === 'string' 
        ? { contents: [{ parts: [{ text: prompt }] }] }
        : { contents: [prompt] };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      if (text) return { text, modelUsed: model };
    } catch { continue; }
  }
  return { text: null, modelUsed: 'none' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 1. Verify caller identity via JWT and check rate limit (10 drafts / day, max 60 total calls across all tools)
  const { errorResponse, auth } = await verifyAuthAndRateLimit(req, 'draft-campaign-message', 10);
  if (errorResponse) return errorResponse;

  try {
    const { contact_name, company_name, channel } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const promptText = `You are a Corporate Relations Associate (CRA) at Placemein, an Indian recruitment and student talent placement partnership organization. Draft a short, professional, non-spammy outreach campaign message for Contact: ${contact_name}, Company: ${company_name}, Channel: ${channel}. Focus: Campaign-based placement partnerships for pre-assessed graduating talent in Full-Stack, AI, and Cybersecurity.`;

    const { text } = await callGemini(promptText, apiKey);
    
    let draft_message = text;
    if (!draft_message) {
        if (channel === 'call') {
            draft_message = `Hi ${contact_name}, I'm calling from Placemein...`;
        } else if (channel === 'linkedin') {
            draft_message = `Hi ${contact_name}, would love to connect to discuss placement partnerships...`;
        } else if (channel === 'whatsapp' || channel === 'text') {
            draft_message = `Hi ${contact_name}, this is Placemein reaching out about hiring fresh talent...`;
        } else {
            draft_message = `Subject: Placement Partnership\n\nHi ${contact_name},\n\nI'm reaching out from Placemein...`;
        }
    }

    if (auth?.user) {
      await logAiUsage(auth.supabase, auth.user.id, 'draft-campaign-message', {
        contact_name,
        company_name,
        channel,
      });
    }

    return new Response(JSON.stringify({ draft_message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
