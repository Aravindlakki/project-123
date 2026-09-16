import { Request, Response } from 'express';
import { companies, hrContacts, enrichCompany, enrichContact } from '../models/db';
import { Company, HRContact, CRA } from '../models/types';
import { generateWithGeminiRetry } from '../services/geminiService';

export function getCompanies(req: Request, res: Response) {
  const search = ((req.query.search as string) || '').toLowerCase();
  let list = companies.map(enrichCompany);
  if (search) {
    list = list.filter(
      (c) => c.name.toLowerCase().includes(search) || (c.industry && c.industry.toLowerCase().includes(search))
    );
  }
  return res.json(list);
}

export function createCompany(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { name, industry, source, notes, website, linkedin_url, employee_count, entered_by_name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ detail: 'Company name is required' });
  }
  const cleanName = name.trim();
  const existing = companies.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    if (employee_count) existing.employee_count = employee_count;
    if (linkedin_url) existing.linkedin_url = linkedin_url;
    if (entered_by_name) existing.entered_by_name = entered_by_name;
    if (website) existing.website = website;
    if (industry) existing.industry = industry;
    return res.json(enrichCompany(existing));
  }
  const newComp: Company = {
    id: `comp_${Date.now()}`,
    name: cleanName,
    industry: industry || 'Information Technology',
    website: website || '',
    linkedin_url: linkedin_url || `https://www.linkedin.com/company/${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    employee_count: employee_count || '50-200 employees',
    entered_by_name: entered_by_name || user.name || 'Aravind Reddy',
    source: source || 'manual',
    notes: notes || '',
    created_by: user.id,
    created_at: new Date().toISOString(),
  };
  companies.unshift(newComp);
  return res.status(201).json(enrichCompany(newComp));
}

export function bulkCompanies(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { items } = req.body as { items: Array<{ name: string; industry?: string; website?: string; linkedin_url?: string; notes?: string; employee_count?: string; entered_by_name?: string }> };
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ detail: 'items array is required' });
  }

  const created: Company[] = [];
  const existingList: Company[] = [];

  for (const item of items) {
    if (!item.name || !item.name.trim()) continue;
    const cleanName = item.name.trim();
    const existing = companies.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      if (item.employee_count) existing.employee_count = item.employee_count;
      if (item.linkedin_url) existing.linkedin_url = item.linkedin_url;
      if (item.entered_by_name) existing.entered_by_name = item.entered_by_name;
      existingList.push(enrichCompany(existing));
    } else {
      const newComp: Company = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        industry: item.industry || 'Information Technology',
        source: 'import',
        website: item.website || '',
        linkedin_url: item.linkedin_url || `https://www.linkedin.com/company/${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        employee_count: item.employee_count || '50-200 employees',
        entered_by_name: item.entered_by_name || user.name || 'Aravind Reddy',
        notes: item.notes || (item.website ? `Website: ${item.website}` : ''),
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      companies.unshift(newComp);
      created.push(enrichCompany(newComp));
    }
  }

  return res.status(201).json({
    created,
    existing: existingList,
    total_processed: items.length,
    total_created: created.length,
    total_existing: existingList.length,
  });
}

export async function parseDocumentHR(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const file = req.file;
  const filename = file?.originalname || '';
  const mimeType = file?.mimetype || 'application/octet-stream';
  const rawTextBody = req.body.raw_text || '';
  const specifiedEnteredByName = req.body.entered_by_name?.trim() || '';

  let textToParse = rawTextBody;
  let fileBufferB64: string | null = null;

  if (file?.buffer) {
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      fileBufferB64 = file.buffer.toString('base64');
    } else {
      textToParse = file.buffer.toString('utf-8') + '\n' + textToParse;
    }
  }

  const prompt = `You are an expert HR Recruitment Intelligence Data Extractor.
Extract the company details, headcount / how many people are working, LinkedIn URL, HR contact details (specifically HR phone numbers / mobile / contact numbers, emails, designations), and who entered or prepared this information.

JSON Schema format (respond with ONLY this raw JSON object, no markdown outside):
{
  "company_name": "Company Name",
  "employee_count": "Estimated or exact number of people working (e.g. '50-200 employees', '1,500 employees', '10,000+ employees', '500+ employees')",
  "linkedin_url": "https://www.linkedin.com/company/... (or standard LinkedIn company URL)",
  "website": "company website or domain",
  "industry": "Industry sector (e.g. IT Services, Cybersecurity, Fintech, SaaS)",
  "entered_by_name": "The person's name who entered, sourced, prepared, or submitted this document (e.g. look for 'Entered by:', 'Sourced by:', 'Prepared by:', 'Name:', 'CRA:', 'Lead:'). If not explicitly stated in document, leave blank or empty string.",
  "hr_contacts": [
    {
      "name": "Full Name of HR / Recruiter / Hiring Lead",
      "title": "Designation / Role (e.g. HR Manager, Senior Talent Acquisition, Recruiter, HR Director)",
      "phone": "HR Contact Number / Mobile Number / Phone / WhatsApp Number found in document or text",
      "email": "HR Work or personal email if present",
      "linkedin_url": "LinkedIn profile URL of the HR person if present"
    }
  ]
}`;

  let extractedData: any = null;

  let contents: any = null;
  if (fileBufferB64) {
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
            data: fileBufferB64,
          },
        },
        { text: prompt },
      ],
    };
  } else if (textToParse.trim().length > 0) {
    contents = `${prompt}\n\nDocument Text Content:\n---\n${textToParse.slice(0, 15000)}\n---`;
  }

  if (contents) {
    const aiResult = await generateWithGeminiRetry({
      contents,
      preferredModels: ['gemini-3.8-flash', 'gemini-2.5-flash'],
    });

    if (aiResult?.text) {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0]);
        } catch {
          // parse failed
        }
      }
    }
  }

  // Fallback heuristics if Gemini was unavailable or document had simple text
  if (!extractedData) {
    const phoneMatches = textToParse.match(/(?:\+91[\s-]?)?[6789]\d{9}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
    const emailMatches = textToParse.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const linkedinMatches = textToParse.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9-_%]+/gi) || [];

    const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim() || 'Imported Organization';

    extractedData = {
      company_name: baseName,
      employee_count: '100-500 employees',
      linkedin_url: linkedinMatches.find((l: string) => l.includes('/company/')) || `https://www.linkedin.com/company/${baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      website: '',
      industry: 'Information Technology',
      entered_by_name: specifiedEnteredByName || user.name || 'Aravind Reddy',
      hr_contacts: [
        {
          name: 'HR Lead / Hiring Manager',
          title: 'Talent Acquisition Specialist',
          phone: phoneMatches[0] || '',
          email: emailMatches[0] || '',
          linkedin_url: linkedinMatches.find((l: string) => l.includes('/in/')) || '',
        },
      ],
    };
  }

  const cleanCompName = (extractedData.company_name || 'Imported Company').trim();
  const finalEnteredByName = specifiedEnteredByName || extractedData.entered_by_name?.trim() || user.name || 'Aravind Reddy';

  let existingComp = companies.find((c) => c.name.toLowerCase() === cleanCompName.toLowerCase());

  if (!existingComp) {
    existingComp = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanCompName,
      industry: extractedData.industry || 'Information Technology',
      website: extractedData.website || '',
      linkedin_url: extractedData.linkedin_url || `https://www.linkedin.com/company/${cleanCompName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      employee_count: extractedData.employee_count || '100-500 employees',
      entered_by_name: finalEnteredByName,
      source: 'import',
      notes: `Imported from PDF/Document: ${filename || 'Direct Intake'}`,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };
    companies.unshift(existingComp);
  } else {
    if (extractedData.employee_count) existingComp.employee_count = extractedData.employee_count;
    if (extractedData.linkedin_url) existingComp.linkedin_url = extractedData.linkedin_url;
    if (finalEnteredByName) existingComp.entered_by_name = finalEnteredByName;
    if (extractedData.industry) existingComp.industry = extractedData.industry;
    if (extractedData.website) existingComp.website = extractedData.website;
  }

  const savedContacts: HRContact[] = [];
  if (Array.isArray(extractedData.hr_contacts)) {
    for (const hr of extractedData.hr_contacts) {
      if (!hr.name && !hr.phone && !hr.email) continue;
      const contactName = hr.name?.trim() || 'HR Executive';
      const newContact: HRContact = {
        id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: contactName,
        title: hr.title?.trim() || 'Talent Acquisition Specialist',
        company_id: existingComp.id,
        phone: hr.phone?.trim() || '',
        email: hr.email?.trim() || '',
        linkedin_url: hr.linkedin_url?.trim() || '',
        source: 'import',
        entered_by_name: finalEnteredByName,
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      hrContacts.unshift(newContact);
      savedContacts.push(enrichContact(newContact));
    }
  }

  const savedCompany = enrichCompany(existingComp);

  return res.json({
    success: true,
    data: extractedData,
    company: savedCompany,
    contacts: savedContacts,
    message: `Stored company "${cleanCompName}" (${savedCompany.employee_count}) with ${savedContacts.length} HR contact(s). Entered by: ${finalEnteredByName}`,
  });
}

export function getCompanyById(req: Request, res: Response) {
  const comp = companies.find((c) => c.id === req.params.id);
  if (!comp) return res.status(404).json({ detail: 'Company not found' });
  return res.json(enrichCompany(comp));
}

export function updateCompany(req: Request, res: Response) {
  const comp = companies.find((c) => c.id === req.params.id);
  if (!comp) return res.status(404).json({ detail: 'Company not found' });
  Object.assign(comp, req.body);
  return res.json(enrichCompany(comp));
}

export function deleteCompany(req: Request, res: Response) {
  const idx = companies.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Company not found' });
  companies.splice(idx, 1);
  return res.status(204).send();
}
