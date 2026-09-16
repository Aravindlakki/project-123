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
    const rawText = formData.get('raw_text') as string || ''
    const enteredByName = formData.get('entered_by_name') as string || ''
    
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    let extractedData: any = null;
    let success = false;
    let message = '';
    
    const promptText = `Extract company details and HR contacts from the document. Return ONLY valid JSON: { "company_name": "", "employee_count": "", "linkedin_url": "", "website": "", "industry": "", "entered_by_name": "${enteredByName}", "hr_contacts": [{ "name": "", "title": "", "phone": "", "email": "", "linkedin_url": "" }] }`;

    let prompt: any = promptText;
    
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      prompt = {
        parts: [
          { text: promptText },
          { inline_data: { mime_type: file.type || 'application/pdf', data: base64 } }
        ]
      }
    }

    const { text, modelUsed } = await callGemini(prompt, apiKey);
    
    if (text) {
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(jsonStr);
        success = true;
        message = 'Extraction successful using Gemini';
      } catch (e) {
        message = 'Failed to parse Gemini output';
      }
    }
    
    if (!success) {
      extractedData = {
        company_name: '',
        employee_count: '',
        linkedin_url: '',
        website: '',
        industry: '',
        entered_by_name: enteredByName,
        hr_contacts: []
      };
      
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
      const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
      
      const emails = rawText.match(emailRegex) || [];
      const phones = rawText.match(phoneRegex) || [];
      const linkedins = rawText.match(linkedinRegex) || [];
      
      if (emails.length > 0 || phones.length > 0 || linkedins.length > 0) {
        extractedData.hr_contacts.push({
          name: '', title: '',
          email: emails[0] || '',
          phone: phones[0] || '',
          linkedin_url: linkedins[0] ? `https://www.${linkedins[0]}` : ''
        });
      }
      success = true;
      message = 'Extracted using regex fallback';
    }

    return new Response(JSON.stringify({ success, data: extractedData, message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
