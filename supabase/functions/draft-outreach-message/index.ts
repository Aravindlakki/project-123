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

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    
    const { contact_name, company_name, channel } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const promptText = `You are a Corporate Relations Associate (CRA) at Placemein, an Indian recruitment and student talent placement partnership organization. Draft a short, professional, non-spammy outreach message for Contact: ${contact_name}, Company: ${company_name}, Channel: ${channel}. Focus: Placement partnerships for pre-assessed graduating talent in Full-Stack, AI, and Cybersecurity.`;

    const { text } = await callGemini(promptText, apiKey);
    
    let draft_text = text;
    if (!draft_text) {
        if (channel === 'call') {
            draft_text = `Hi ${contact_name}, I'm calling from Placemein...`;
        } else if (channel === 'linkedin') {
            draft_text = `Hi ${contact_name}, would love to connect to discuss placement partnerships...`;
        } else if (channel === 'whatsapp' || channel === 'text') {
            draft_text = `Hi ${contact_name}, this is Placemein reaching out about hiring fresh talent...`;
        } else {
            draft_text = `Subject: Placement Partnership\n\nHi ${contact_name},\n\nI'm reaching out from Placemein...`;
        }
    }

    return new Response(JSON.stringify({ draft_text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
