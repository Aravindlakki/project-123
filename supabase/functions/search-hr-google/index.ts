import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callGemini(prompt: string | object, apiKey: string): Promise<{text: string | null, modelUsed: string}> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = typeof prompt === 'string' 
        ? { contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }
        : { contents: [prompt], tools: [{ google_search: {} }] };
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

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    
    const { company_name, contact_name, role_focus } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const promptText = `Search for HR/Talent Acquisition contacts at ${company_name}${contact_name ? ` named ${contact_name}` : ''}${role_focus ? ` focusing on ${role_focus}` : ''}. Return ONLY a JSON array of contacts: [{ "name": "", "title": "", "company_name": "${company_name}", "email": "", "phone": "", "linkedin_url": "", "location": "", "summary": "" }]`;

    const { text, modelUsed } = await callGemini(promptText, apiKey);
    
    let contacts = [];
    if (text) {
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        contacts = JSON.parse(jsonStr);
        contacts = contacts.map((c: any) => ({ ...c, phone: '' }));
      } catch (e) {
      }
    }

    return new Response(JSON.stringify({
      success: true,
      contacts,
      web_sources: [],
      search_queries: [],
      model_used: modelUsed,
      phone_policy_note: 'Phone numbers are left blank for manual entry per privacy rules.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
