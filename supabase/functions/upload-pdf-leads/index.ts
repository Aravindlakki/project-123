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

    const promptText = `Extract all rows into a JSON array with fields: company_name, website, linkedin_url, employee_count, hr_name, title, phone, email, hr_linkedin, domain, location, remarks, spoc, entered_by_name. Return ONLY valid JSON array.`;
    
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const prompt = {
      parts: [
        { text: promptText },
        { inline_data: { mime_type: file.type || 'application/pdf', data: base64 } }
      ]
    }

    const { text, modelUsed } = await callGemini(prompt, apiKey);
    
    let extractedData: any[] = [];
    if (text) {
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Failed to parse Gemini JSON output')
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase Service keys')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let importedCount = 0;
    for (const row of extractedData) {
      if (!row.company_name) continue;

      let companyId;
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', row.company_name)
        .maybeSingle()

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            name: row.company_name,
            website: row.website,
            linkedin_url: row.linkedin_url,
            employee_count: row.employee_count,
            domain: row.domain,
            location: row.location
          })
          .select('id')
          .single()
        if (newCompany) companyId = newCompany.id;
      }

      if (companyId && row.hr_name) {
        await supabase
          .from('contacts')
          .insert({
            company_id: companyId,
            name: row.hr_name,
            title: row.title,
            phone: row.phone,
            email: row.email,
            linkedin_url: row.hr_linkedin,
            remarks: row.remarks,
            spoc: row.spoc,
            entered_by_name: row.entered_by_name
          })
      }
      importedCount++;
    }

    return new Response(JSON.stringify({
      success: true,
      filename: file.name,
      extracted_rows: extractedData.length,
      imported_count: importedCount,
      message: 'Processing complete',
      sample_records: extractedData.slice(0, 5)
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
