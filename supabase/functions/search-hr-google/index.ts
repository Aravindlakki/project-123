import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAuthAndRateLimit, logAiUsage, corsHeaders } from '../_shared/auth.ts'

async function callGeminiWithSearch(prompt: string, apiKey: string): Promise<{
  text: string | null;
  modelUsed: string;
  webSources: Array<{ title: string; url: string }>;
  searchQueries: string[];
}> {
  // Use Gemini 2.5 Flash with live Google Search tool
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
        // Retry with google_search underscore notation if googleSearch isn't accepted
        const altBody = {
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
        };
        const altRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(altBody),
        });
        if (!altRes.ok) continue;
        const data = await altRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        const metadata = data?.candidates?.[0]?.groundingMetadata;
        const webSources = (metadata?.groundingChunks || [])
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Web Reference',
            url: chunk.web?.uri || '',
          }))
          .filter((s: any) => s.url);
        const searchQueries = metadata?.webSearchQueries || [];
        if (text) return { text, modelUsed: model, webSources, searchQueries };
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      const metadata = data?.candidates?.[0]?.groundingMetadata;
      const webSources = (metadata?.groundingChunks || [])
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Web Reference',
          url: chunk.web?.uri || '',
        }))
        .filter((s: any) => s.url);
      const searchQueries = metadata?.webSearchQueries || [];

      if (text) return { text, modelUsed: model, webSources, searchQueries };
    } catch {
      continue;
    }
  }
  return { text: null, modelUsed: 'none', webSources: [], searchQueries: [] };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Verify caller identity via JWT and check rate limit (30 searches / day, max 60 total calls across all tools)
  const { errorResponse, auth } = await verifyAuthAndRateLimit(req, 'search-hr-google', 30);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const company_name = body.company_name?.trim();
    const contact_name = body.contact_name?.trim();
    const role_focus = body.role_focus?.trim() || 'HR, Talent Acquisition, Recruiter';

    if (!company_name) {
      throw new Error('company_name is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in Supabase Edge Function Secrets. Please set GEMINI_API_KEY in your Supabase Dashboard under Project Settings -> Edge Functions -> Secrets.'
      );
    }

    const promptText = `Use Google Search to find real, verified HR, Talent Acquisition, University Relations, Campus Hiring, or Recruiter professionals currently working at "${company_name}"${contact_name ? ` matching "${contact_name}"` : ''}.
Focus role area: ${role_focus}.

CRITICAL PRIVACY RULE:
- Do NOT search for, guess, or output any phone numbers.
- The phone field MUST strictly be an empty string ("").

Return ONLY a JSON array of contacts:
[
  {
    "name": "Full Name",
    "title": "Exact Role / Title at ${company_name}",
    "company_name": "${company_name}",
    "email": "work email or corporate pattern if verified, else empty string",
    "phone": "",
    "linkedin_url": "real LinkedIn profile URL or search URL",
    "location": "City, Country",
    "summary": "Brief note on their focus area"
  }
]`;

    const { text, modelUsed, webSources, searchQueries } = await callGeminiWithSearch(promptText, apiKey);

    let contacts = [];
    if (text) {
      try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        cleanText = cleanText.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
        const parsed = JSON.parse(cleanText);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        contacts = list
          .map((c: any) => ({
            name: String(c.name || '').trim(),
            title: String(c.title || 'Talent Acquisition Specialist').trim(),
            company_name: String(c.company_name || company_name).trim(),
            email: String(c.email || '').trim(),
            phone: '', // MANDATORY PRIVACY: Phone numbers strictly empty
            linkedin_url: String(c.linkedin_url || '').trim(),
            location: c.location ? String(c.location).trim() : undefined,
            summary: c.summary ? String(c.summary).trim() : undefined,
          }))
          .filter((c: any) => c.name.length > 0 && !c.name.toLowerCase().includes('recruitment team'));
      } catch (e) {
        console.error('Failed to parse Gemini contacts JSON:', e);
      }
    }

    if (auth?.user) {
      await logAiUsage(auth.supabase, auth.user.id, 'search-hr-google', {
        company_name,
        contact_count: contacts.length,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        company_name,
        company_id: body.company_id,
        contacts,
        web_sources: webSources,
        search_queries: searchQueries,
        model_used: modelUsed,
        phone_policy_note: 'Phone numbers are strictly left blank for manual recruiter entry per privacy policy.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Search failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
