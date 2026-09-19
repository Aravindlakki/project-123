import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuthAndRateLimit, logAiUsage, corsHeaders } from '../_shared/auth.ts';

async function callGeminiWithSearch(prompt: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Retry with google_search underscore format
        const altRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
          }),
        });
        if (!altRes.ok) continue;
        const data = await altRes.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
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

  // 1. Verify caller identity via JWT and check rate limit (10 enrichment calls / day, max 60 total calls across all tools)
  const { errorResponse, auth } = await verifyAuthAndRateLimit(req, 'enrich-contact', 10);
  if (errorResponse) return errorResponse;

  try {
    let body: any = {};
    const url = new URL(req.url);
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (_) {}
    }
    const name = (body.name || url.searchParams.get('name') || '').trim();
    const companyName = (body.company_name || url.searchParams.get('company_name') || '').trim();
    const companyId = body.company_id || url.searchParams.get('company_id') || undefined;

    if (!name || !companyName) {
      throw new Error('Both name and company_name are required for contact enrichment');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in Supabase Secrets. Please add it in Supabase Project Settings -> Edge Functions -> Secrets.'
      );
    }

    let enrichedData: any = {
      name,
      company_name: companyName,
      company_id: companyId,
      title: 'Talent Acquisition Specialist',
      email: '',
      phone: '', // STRICT PRIVACY MANDATE: phone numbers must remain blank
      linkedin_url: '',
      source: 'gemini-grounded',
    };

    // Free Gemini with Google Search Grounding for verified enrichment
    const prompt = `Find real, current verified professional details for "${name}" working at "${companyName}".
Search Google and LinkedIn to find their exact role/designation, work email format, and LinkedIn URL.
Return ONLY a valid JSON object:
{
  "title": "Exact job title at ${companyName}",
  "email": "work email or email pattern if discoverable, otherwise empty string",
  "phone": "",
  "linkedin_url": "real linkedin profile URL or company employee search URL"
}
CRITICAL: Phone MUST be an empty string. Never invent or guess phone numbers.`;

    const aiText = await callGeminiWithSearch(prompt, geminiApiKey);
    if (aiText) {
      try {
        const clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          enrichedData.title = parsed.title || enrichedData.title;
          enrichedData.email = parsed.email || '';
          enrichedData.linkedin_url = parsed.linkedin_url || '';
          enrichedData.phone = ''; // Strict privacy
        }
      } catch (e) {
        console.error('Failed to parse enrichment JSON', e);
      }
    }

    if (auth?.user) {
      await logAiUsage(auth.supabase, auth.user.id, 'enrich-contact', {
        name,
        company: companyName,
        source: 'gemini-grounded',
      });
    }

    return new Response(JSON.stringify(enrichedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Enrichment failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
