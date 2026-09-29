import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function: POST /api/extract-lead
// Securely extracts company, role, domain, and metadata from job postings using Gemini
// Requires a valid authenticated Supabase session.
export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Authenticate with Supabase JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing session token. Please log in.' });
    }
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session.' });
      }
    } catch (e: any) {
      return res.status(401).json({ error: 'Authentication check failed: ' + (e?.message || 'Unknown error') });
    }
  }

  // 2. Validate input text
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid payload: "text" string is required.' });
  }

  // Enforce max text length of 30,000 characters to stay well within limits
  const sanitizedText = text.slice(0, 30000);

  // 3. Check for GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured in environment variables. Falling back to client-side rule parser.',
      fallbackRequired: true,
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a recruitment CRM data extraction assistant.
Extract company and job posting details from the provided text or HTML snippet.

CRITICAL RULES:
1. Extract: company_name, role_title, domain (e.g. Cyber Security, Full Stack, Cloud, AI/ML, Data), employee_count, location, experience (e.g. 3-5 years), and job_link if present.
2. COMPANY SIZE (employee_count): Map to one of the following exact ranges if mentioned or discernible: "1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1,000 employees", "1,001-5,000 employees", "5,001-10,000 employees", "10,000+ employees". If unknown, return "".
3. STRICT NEGATIVE CONSTRAINT ON CONTACT DATA:
   - Do NOT guess, invent, or extrapolate HR or recruiter details.
   - If an HR/Recruiter name, HR email, HR phone, or HR LinkedIn URL is NOT explicitly, clearly written in the text as the hiring contact, you MUST return "" for those fields.
   - Never extrapolate personal names from general company leadership or boilerplate text.
   - Never generate random, dummy, or fake phone numbers. Phone MUST remain empty "" unless explicitly given as a recruiter contact number in the job text.

Job posting text:
${sanitizedText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company_name: { type: Type.STRING },
            role_title: { type: Type.STRING },
            domain: { type: Type.STRING },
            employee_count: { type: Type.STRING },
            location: { type: Type.STRING },
            experience: { type: Type.STRING },
            job_link: { type: Type.STRING },
            notes: { type: Type.STRING },
            hr_name: { type: Type.STRING },
            hr_title: { type: Type.STRING },
            hr_email: { type: Type.STRING },
            hr_phone: { type: Type.STRING },
            hr_linkedin: { type: Type.STRING },
          },
          required: ['company_name', 'role_title'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.status(200).json({
      success: true,
      data: parsedJson,
    });
  } catch (err: any) {
    console.error('Gemini extraction error:', err);
    return res.status(500).json({
      error: 'AI extraction failed: ' + (err?.message || 'Internal error'),
      fallbackRequired: true,
    });
  }
}
