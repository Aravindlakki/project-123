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
    
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) throw new Error('No file provided')

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const promptText = `Extract job description details from the document. Return ONLY valid JSON: { "company_name": "", "role_title": "", "confidence": "high", "summary": "" }`;
    
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const prompt = {
      parts: [
        { text: promptText },
        { inline_data: { mime_type: file.type || 'application/pdf', data: base64 } }
      ]
    }

    const { text, modelUsed } = await callGemini(prompt, apiKey);
    
    let company_name = 'Unknown';
    let role_title = 'Unknown';
    let confidence = 'low';
    let summary = '';
    let ai_active = false;
    let extraction_engine = 'heuristic';

    if (text) {
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);
        company_name = data.company_name || company_name;
        role_title = data.role_title || role_title;
        confidence = data.confidence || 'medium';
        summary = data.summary || '';
        ai_active = true;
        extraction_engine = `gemini-${modelUsed}`;
      } catch (e) {
        const fnParts = file.name.split(/[-_ ]/);
        if (fnParts.length >= 2) {
            company_name = fnParts[0];
            role_title = fnParts.slice(1).join(' ').split('.')[0];
        }
      }
    } else {
        const fnParts = file.name.split(/[-_ ]/);
        if (fnParts.length >= 2) {
            company_name = fnParts[0];
            role_title = fnParts.slice(1).join(' ').split('.')[0];
        }
    }

    return new Response(JSON.stringify({
      filename: file.name,
      company_name,
      role_title,
      confidence,
      raw_text: '',
      ocr_warning: null,
      ai_active,
      extraction_engine
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
