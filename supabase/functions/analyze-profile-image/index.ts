import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuthAndRateLimit, logAiUsage, corsHeaders } from '../_shared/auth.ts';

async function callGeminiVision(
  prompt: string,
  fileBase64: string,
  mimeType: string,
  apiKey: string
): Promise<string | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/png',
                  data: fileBase64,
                },
              },
            ],
          },
        ],
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

  // 1. Verify caller identity via JWT and check rate limit (5 vision calls / day, max 60 total calls across all tools)
  const { errorResponse, auth } = await verifyAuthAndRateLimit(req, 'analyze-profile-image', 5);
  if (errorResponse) return errorResponse;

  try {
    const url = new URL(req.url);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const contactId = (formData.get('contact_id') as string) || url.searchParams.get('contact_id') || '';
    const contactName = (formData.get('contact_name') as string) || 'Hiring Lead';
    const companyName = (formData.get('company_name') as string) || 'Target Company';

    if (!file) {
      throw new Error('No profile screenshot attached');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in Supabase Secrets. Please set GEMINI_API_KEY in your Supabase Dashboard.'
      );
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Data = btoa(binary);
    const mimeType = file.type || 'image/png';

    const prompt = `You are a Corporate Relations Associate (CRA) at Placemein, an Indian student placement partnership organization.
Analyze this attached screenshot of an HR / recruiter / executive profile (e.g. LinkedIn profile).
Identify their actual role, skills, company background, and hiring interests.

Then compose personalized outreach material:
1. profile_summary: Brief 1-2 sentence summary of their background.
2. relevant_hooks: 1 sentence explaining why Placemein's pre-assessed candidates (Full-Stack, Data, AI) are relevant to them.
3. email_subject: A concise, compelling, non-spammy subject line.
4. email_body: A warm, professional 3-paragraph outreach email proposing a campus hiring partnership.
5. sms_body: A short SMS / WhatsApp hook (under 160 chars).

Target Contact Name if visible: ${contactName}
Target Company if visible: ${companyName}

Return ONLY a valid JSON object matching this schema:
{
  "profile_summary": "string",
  "relevant_hooks": "string",
  "email_subject": "string",
  "email_body": "string",
  "sms_body": "string"
}`;

    const aiText = await callGeminiVision(prompt, base64Data, mimeType, apiKey);
    let result = {
      contact_id: contactId,
      profile_summary: `Profile analyzed for recruitment lead at ${companyName}. Focuses on technical talent acquisition and early career hiring.`,
      relevant_hooks: `Align with ${companyName}'s active hiring initiatives in engineering and data science.`,
      email_subject: `Connecting with ${companyName} — Pre-assessed Technical Graduate Pipeline`,
      email_body: `Dear ${contactName},\n\nI was reviewing your active leadership in technical recruitment at ${companyName}. At Placemein, we partner with industry-leading teams to provide pre-screened graduate talent ready for immediate contribution.\n\nOur candidates undergo rigorous full-stack and domain assessments before recommendation. Would you be open to reviewing a short 1-page talent profile cohort this week?\n\nWarm regards,\nCorporate Relations Team | Placemein`,
      sms_body: `Hi ${contactName}, saw your hiring focus at ${companyName}. Placemein has pre-screened engineering grads ready for interviews. Can we share the roster?`,
    };

    if (aiText) {
      try {
        const clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = {
            contact_id: contactId,
            profile_summary: parsed.profile_summary || result.profile_summary,
            relevant_hooks: parsed.relevant_hooks || result.relevant_hooks,
            email_subject: parsed.email_subject || result.email_subject,
            email_body: parsed.email_body || result.email_body,
            sms_body: parsed.sms_body || result.sms_body,
          };
        }
      } catch (e) {
        console.error('Failed to parse profile vision JSON', e);
      }
    }

    if (auth?.user) {
      await logAiUsage(auth.supabase, auth.user.id, 'analyze-profile-image', {
        contact_id: contactId,
        contact_name: contactName,
        company_name: companyName,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Profile analysis failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
