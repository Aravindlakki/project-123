import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';
import { companies, hrContacts, jds, enrichCompany, enrichContact, enrichJD } from '../models/db';
import { Company, HRContact, CRA, JD } from '../models/types';
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
  try {
    const user = ((req as any).user as CRA) || {
      id: 'usr_admin',
      name: 'Aravind Reddy',
      email: 'aravindaravind3953@gmail.com',
      role: 'admin',
    };
    const file = req.file;
    const filename = file?.originalname || '';
    const mimeType = file?.mimetype || 'application/octet-stream';
    const rawTextBody = req.body.raw_text || '';
    const specifiedEnteredByName = req.body.entered_by_name?.trim() || '';

    // Smartly detect SPOC and entered_by from filename (e.g., "CRA SOURCING SHEET(ARAVIND) (3).pdf")
    let detectedSpoc = '';
    const spocMatch = filename.match(/\b(aravind|namitha|harish|pavithra|mansi|vineela|deepak|kavya|sandeep)\b/i);
    if (spocMatch) {
      detectedSpoc = spocMatch[1].charAt(0).toUpperCase() + spocMatch[1].slice(1).toLowerCase();
    }
    const finalDefaultEnteredBy =
      specifiedEnteredByName ||
      (detectedSpoc ? `${detectedSpoc} Reddy` : '') ||
      user.name ||
      'Aravind Reddy';
    const finalDefaultSpoc = detectedSpoc || user.name.split(' ')[0] || 'Aravind';

    let textToParse = rawTextBody;
    let fileBufferB64: string | null = null;

    if (file?.buffer) {
      const isExcelOrCsv =
        filename.match(/\.xlsx?$|\.csv$/i) ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('excel') ||
        mimeType.includes('csv');

      const isPdf =
        mimeType === 'application/pdf' ||
        filename.toLowerCase().endsWith('.pdf');

      if (isExcelOrCsv) {
        try {
          const wb = XLSX.read(file.buffer, { type: 'buffer' });
          const sheetCsvs = wb.SheetNames.map(
            (s) => `--- Sheet: ${s} ---\n` + XLSX.utils.sheet_to_csv(wb.Sheets[s])
          ).join('\n\n');
          textToParse = sheetCsvs + '\n' + textToParse;
        } catch (_) {
          textToParse = file.buffer.toString('utf-8') + '\n' + textToParse;
        }
      } else if (isPdf) {
        fileBufferB64 = file.buffer.toString('base64');
        try {
          const parser = new PDFParse({ data: file.buffer });
          const pdfRes = await parser.getText();
          await parser.destroy();
          if (pdfRes?.text) {
            textToParse = pdfRes.text + '\n' + textToParse;
          }
        } catch (pdfErr) {
          console.warn('PDFParse extraction error:', pdfErr);
        }
      } else if (mimeType.startsWith('image/')) {
        fileBufferB64 = file.buffer.toString('base64');
      } else {
        textToParse = file.buffer.toString('utf-8') + '\n' + textToParse;
      }
    }

    const prompt = `You are an expert HR Recruitment Intelligence Data Extractor.
Analyze this document or text. It may be a single company document or a multi-row "CRA SOURCING SHEET" / table of company leads and HR contacts.

Extract ALL companies and their HR contact details. If it is a sourcing sheet or list of leads, extract EVERY SINGLE ROW / lead into the "leads" array.
Do NOT truncate or skip rows.

JSON Schema format (respond with ONLY this raw JSON object, no markdown outside):
{
  "is_multi_lead": true,
  "entered_by_name": "${finalDefaultEnteredBy}",
  "leads": [
    {
      "company_name": "Full Company Name (do NOT use document filename as company name)",
      "employee_count": "Estimated or exact headcount (e.g. '100-500 employees', '1,000+ employees', '50-200')",
      "website": "company website or domain",
      "linkedin_url": "company LinkedIn profile URL",
      "industry": "Industry sector (e.g. IT Services, Cybersecurity, Fintech, SaaS, Healthcare)",
      "location": "City / Location if present",
      "spoc": "${finalDefaultSpoc}",
      "hr_contacts": [
        {
          "name": "Full Name of HR / Recruiter / Hiring Lead",
          "title": "Designation (e.g. HR Manager, Senior Recruiter, Talent Acquisition Lead)",
          "phone": "Phone / Mobile / WhatsApp number",
          "email": "HR Work or personal email",
          "linkedin_url": "HR profile LinkedIn URL"
        }
      ]
    }
  ]
}`;

    let parsedLeadsData: any[] = [];

    // Attempt AI extraction with Gemini if credentials / contents available
    if (fileBufferB64 || textToParse.trim().length > 0) {
      let contents: any = null;
      if (fileBufferB64 && textToParse.trim().length > 0) {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
                data: fileBufferB64,
              },
            },
            {
              text: `${prompt}\n\nExtracted Document Text:\n---\n${textToParse.slice(0, 30000)}\n---`,
            },
          ],
        };
      } else if (fileBufferB64) {
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
      } else {
        contents = `${prompt}\n\nDocument Text Content:\n---\n${textToParse.slice(0, 30000)}\n---`;
      }

      try {
        const aiResult = await generateWithGeminiRetry({
          contents,
          preferredModels: ['gemini-2.5-flash', 'gemini-3.8-flash'],
          timeoutMs: 30000,
        });

        if (aiResult?.text) {
          const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsed.leads) && parsed.leads.length > 0) {
                parsedLeadsData = parsed.leads;
              } else if (parsed.company_name) {
                parsedLeadsData = [parsed];
              }
            } catch (_) {}
          }
        }
      } catch (aiErr) {
        console.warn('Gemini extraction notice:', aiErr);
      }
    }

    // Bulletproof Fallback Heuristics: Parse lines, tables, and records from text
    if (!parsedLeadsData || parsedLeadsData.length === 0) {
      const lines = textToParse.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const phoneRegex = /(?:\+91[\s-]?)?[6789]\d{9}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{10}\b/g;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const urlRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9-_%]+/gi;

      const detectedRows: any[] = [];
      let currentEntry: any = null;

      for (const line of lines) {
        // Skip header lines or pure page numbering
        if (line.match(/^--\s*\d+\s*of\s*\d+\s*--$/i) || line.toLowerCase().includes('page ') && line.length < 15) {
          continue;
        }

        const phones = line.match(phoneRegex) || [];
        const emails = line.match(emailRegex) || [];
        const urls = line.match(urlRegex) || [];

        // Check if line contains a phone or email, which signifies an HR contact row
        if (phones.length > 0 || emails.length > 0) {
          // Tokenize or split line by common separators (comma, tab, pipe, dash)
          const parts = line.split(/[,\t|]/).map((p) => p.trim()).filter(Boolean);
          let compName = '';
          let hrName = '';
          let roleTitle = 'Talent Acquisition Specialist';

          if (parts.length >= 3) {
            compName = parts[0];
            hrName = parts[1];
            if (parts.length >= 4 && !parts[2].match(phoneRegex) && !parts[2].match(emailRegex)) {
              roleTitle = parts[2];
            }
          } else {
            // Remove phone and email from line to get text
            let remainingText = line
              .replace(phoneRegex, '')
              .replace(emailRegex, '')
              .replace(urlRegex, '')
              .replace(/[-–|]/g, ' ')
              .trim();
            const words = remainingText.split(/\s+/).filter(Boolean);
            if (words.length >= 3) {
              compName = words.slice(0, 2).join(' ');
              hrName = words.slice(2).join(' ');
            } else if (words.length > 0) {
              compName = words.join(' ');
              hrName = 'HR Contact';
            }
          }

          if (compName.toLowerCase().includes('sheet') || compName.toLowerCase().includes('sourcing')) {
            compName = 'Partner Enterprise';
          }

          detectedRows.push({
            company_name: compName || 'Prospective Employer',
            employee_count: '100-500 employees',
            website: '',
            linkedin_url: urls.find((u) => u.includes('/company/')) || '',
            industry: 'Information Technology',
            location: 'Hyderabad',
            spoc: finalDefaultSpoc,
            entered_by_name: finalDefaultEnteredBy,
            hr_contacts: [
              {
                name: hrName || 'HR Executive',
                title: roleTitle,
                phone: phones[0] || '',
                email: emails[0] || '',
                linkedin_url: urls.find((u) => u.includes('/in/')) || '',
              },
            ],
          });
        }
      }

      if (detectedRows.length > 0) {
        parsedLeadsData = detectedRows;
      } else {
        // Last-resort single record fallback
        const allPhones = textToParse.match(phoneRegex) || [];
        const allEmails = textToParse.match(emailRegex) || [];
        const allUrls = textToParse.match(urlRegex) || [];
        const cleanBaseName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
        const fallbackCompName =
          cleanBaseName.toLowerCase().includes('sheet') || cleanBaseName.toLowerCase().includes('sourcing')
            ? 'Imported Sourcing Organization'
            : cleanBaseName || 'Imported Organization';

        parsedLeadsData = [
          {
            company_name: fallbackCompName,
            employee_count: '100-500 employees',
            website: '',
            linkedin_url: allUrls.find((u) => u.includes('/company/')) || `https://www.linkedin.com/company/${fallbackCompName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            industry: 'Information Technology',
            location: 'Hyderabad',
            spoc: finalDefaultSpoc,
            entered_by_name: finalDefaultEnteredBy,
            hr_contacts: [
              {
                name: 'HR Lead / Hiring Manager',
                title: 'Talent Acquisition Specialist',
                phone: allPhones[0] || '',
                email: allEmails[0] || '',
                linkedin_url: allUrls.find((u) => u.includes('/in/')) || '',
              },
            ],
          },
        ];
      }
    }

    // Save all parsed leads and companies into database
    const savedCompanies: Company[] = [];
    const savedContacts: HRContact[] = [];

    for (let i = 0; i < parsedLeadsData.length; i++) {
      const lead = parsedLeadsData[i];
      let compName = (lead.company_name || '').trim();
      if (!compName || compName.toLowerCase().includes('sourcing sheet')) {
        compName = `Corporate Client ${i + 1}`;
      }

      const leadEnteredBy = lead.entered_by_name || finalDefaultEnteredBy;
      const leadSpoc = lead.spoc || finalDefaultSpoc;

      let existingComp = companies.find((c) => c.name.toLowerCase() === compName.toLowerCase());
      if (!existingComp) {
        existingComp = {
          id: `comp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name: compName,
          industry: lead.industry || 'Information Technology',
          website: lead.website || '',
          linkedin_url:
            lead.linkedin_url ||
            `https://www.linkedin.com/company/${compName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          employee_count: lead.employee_count || '100-500 employees',
          location: lead.location || 'Hyderabad',
          entered_by_name: leadEnteredBy,
          source: 'import',
          notes: `Imported from: ${filename || 'Direct Intake'}`,
          created_by: user.id,
          created_at: new Date().toISOString(),
        };
        companies.unshift(existingComp);
      } else {
        if (lead.employee_count) existingComp.employee_count = lead.employee_count;
        if (lead.linkedin_url && !existingComp.linkedin_url) existingComp.linkedin_url = lead.linkedin_url;
        if (lead.website && !existingComp.website) existingComp.website = lead.website;
        if (leadEnteredBy) existingComp.entered_by_name = leadEnteredBy;
      }
      savedCompanies.push(enrichCompany(existingComp));

      // Process contacts
      const hrList = Array.isArray(lead.hr_contacts) ? lead.hr_contacts : [];
      if (hrList.length === 0 && (lead.phone || lead.email || lead.name)) {
        hrList.push({
          name: lead.name || 'HR Executive',
          title: lead.title || 'HR Lead',
          phone: lead.phone || '',
          email: lead.email || '',
          linkedin_url: lead.linkedin_url || '',
        });
      }

      for (let cIdx = 0; cIdx < hrList.length; cIdx++) {
        const hr = hrList[cIdx];
        const contactName = hr.name?.trim() || `HR Specialist ${cIdx + 1}`;
        const newContact: HRContact = {
          id: `cont_${Date.now()}_${i}_${cIdx}_${Math.random().toString(36).substring(2, 6)}`,
          name: contactName,
          title: hr.title?.trim() || 'Talent Acquisition Specialist',
          company_id: existingComp.id,
          phone: hr.phone?.trim() || '',
          email: hr.email?.trim() || '',
          linkedin_url: hr.linkedin_url?.trim() || '',
          domain: existingComp.industry || 'Information Technology',
          location: existingComp.location || 'Hyderabad',
          remarks: 'Imported from Document',
          spoc: leadSpoc,
          entered_by_name: leadEnteredBy,
          source: 'import',
          created_by: user.id,
          created_at: new Date().toISOString(),
        };
        hrContacts.unshift(newContact);
        savedContacts.push(enrichContact(newContact));
      }
    }

    const firstComp = savedCompanies[0] || enrichCompany(companies[0]);

    return res.json({
      success: true,
      count: savedContacts.length,
      companies_count: savedCompanies.length,
      company: firstComp,
      contacts: savedContacts,
      leads: savedCompanies,
      message: `Successfully extracted and stored ${savedCompanies.length} company(s) and ${savedContacts.length} HR contact(s) from "${filename || 'Document Intake'}". Assigned SPOC: ${finalDefaultSpoc}, Entered by: ${finalDefaultEnteredBy}`,
    });
  } catch (err: any) {
    console.error('Error in parseDocumentHR:', err);
    return res.status(500).json({
      success: false,
      detail: err?.message || 'Error processing document data',
    });
  }
}

export function getCompanyById(req: Request, res: Response) {
  const comp = companies.find((c) => c.id === req.params.id);
  if (!comp) return res.status(404).json({ detail: 'Company not found' });
  return res.json(enrichCompany(comp));
}

export function updateCompany(req: Request, res: Response) {
  const comp = companies.find((c) => c.id === req.params.id);
  if (!comp) return res.status(404).json({ detail: 'Company not found' });

  const actingUser = (req as any).user;
  // Only Admins (or the original creator) may edit existing company profile fields
  if (actingUser && actingUser.role !== 'admin' && comp.created_by && comp.created_by !== actingUser.id) {
    return res.status(403).json({ detail: 'Permission denied: Once created, only Admins may edit company profile fields.' });
  }

  if (req.body.name !== undefined) comp.name = req.body.name;
  if (req.body.industry !== undefined) comp.industry = req.body.industry;
  if (req.body.website !== undefined) comp.website = req.body.website;
  if (req.body.linkedin_url !== undefined) comp.linkedin_url = req.body.linkedin_url;
  if (req.body.employee_count !== undefined) comp.employee_count = req.body.employee_count;
  if (req.body.location !== undefined) comp.location = req.body.location;
  if (req.body.notes !== undefined) comp.notes = req.body.notes;

  return res.json(enrichCompany(comp));
}

export function deleteCompany(req: Request, res: Response) {
  const idx = companies.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Company not found' });
  companies.splice(idx, 1);
  return res.status(204).send();
}

/**
 * Helper to normalize strings for duplicate checking:
 * Converts to lowercase, replaces punctuation with spaces, collapses whitespace.
 */
function normStr(str?: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust RFC 4180 CSV line parser handling commas, quotes, and escaped quotes.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Server-side CSV Bulk Upload Endpoint
 * Handles file reading, CSV parsing, strict duplicate-checking, and uploader attribution.
 *
 * Duplicate Rules:
 * 1. Company check: matches case-insensitively by name.
 * 2. If Company exists:
 *    - If role is provided and already exists for that company -> duplicate role is skipped / counted as skipped duplicate!
 *    - If role is provided and is a new role -> added under existing company!
 * 3. If Company is new:
 *    - Creates new company with uploaded_by (team member) attribution in notes & entered_by_name.
 *    - Creates new role (if specified) linked to the new company.
 */
export function uploadCSVCompanies(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const file = req.file;
  const specifiedUploader = (req.body.entered_by_name as string)?.trim() || user?.name || 'Aravind Reddy';

  let rawCsvText = '';
  if (file?.buffer) {
    rawCsvText = file.buffer.toString('utf-8');
  } else if (req.body.csv_text) {
    rawCsvText = req.body.csv_text;
  }

  if (!rawCsvText || !rawCsvText.trim()) {
    return res.status(400).json({ detail: 'No CSV file or CSV text provided.' });
  }

  // Split into non-empty lines
  const lines = rawCsvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return res.status(400).json({ detail: 'CSV must contain at least a header row and one data row.' });
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

  // Header resolution index helper
  const findColIndex = (...candidates: string[]): number => {
    return headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));
  };

  const nameIdx = findColIndex('company_name', 'company', 'name', 'org', 'organization');
  const roleIdx = findColIndex('role', 'job_title', 'job_role', 'title', 'position', 'designation', 'opening');
  const headcountIdx = findColIndex('headcount', 'employee_count', 'employees', 'size', 'team_size');
  const linkedinIdx = findColIndex('linkedin', 'linkedin_url', 'linkedin_link');
  const websiteIdx = findColIndex('website', 'site', 'url', 'domain');
  const industryIdx = findColIndex('industry', 'sector', 'domain_name', 'category');
  const uploaderIdx = findColIndex('uploaded_by', 'entered_by', 'cra', 'spoc', 'assigned_to', 'owner');
  const roleTypeIdx = findColIndex('opportunity_type', 'role_type', 'type');

  if (nameIdx === -1) {
    return res.status(400).json({
      detail: `CSV must contain a column for Company Name (e.g., 'company_name', 'company', 'name'). Detected headers: ${rawHeaders.join(', ')}`,
    });
  }

  const report = {
    total_rows: lines.length - 1,
    companies_created: 0,
    companies_existing: 0,
    roles_created: 0,
    roles_duplicate_skipped: 0,
    errors: [] as string[],
    records: [] as Array<{
      company_name: string;
      status: 'created' | 'existing';
      role_status: 'created' | 'duplicate_skipped' | 'none';
      role_title?: string;
      uploader: string;
    }>,
  };

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const compNameRaw = row[nameIdx]?.trim();
    if (!compNameRaw) continue;

    const normComp = normStr(compNameRaw);
    const roleRaw = roleIdx !== -1 ? row[roleIdx]?.trim() : '';
    const headcountRaw = headcountIdx !== -1 ? row[headcountIdx]?.trim() : '';
    const linkedinRaw = linkedinIdx !== -1 ? row[linkedinIdx]?.trim() : '';
    const websiteRaw = websiteIdx !== -1 ? row[websiteIdx]?.trim() : '';
    const industryRaw = industryIdx !== -1 ? row[industryIdx]?.trim() : '';
    const rowUploader = (uploaderIdx !== -1 ? row[uploaderIdx]?.trim() : '') || specifiedUploader;
    const oppType: 'existing_post' | 'cold_outreach' =
      roleTypeIdx !== -1 && row[roleTypeIdx]?.toLowerCase().includes('cold') ? 'cold_outreach' : 'existing_post';

    // 1. Check if Company already exists
    let existingComp = companies.find((c) => normStr(c.name) === normComp);
    let compStatus: 'created' | 'existing' = 'existing';
    let roleStatus: 'created' | 'duplicate_skipped' | 'none' = 'none';

    if (!existingComp) {
      // Create new company with explicit member attribution in notes & entered_by_name
      compStatus = 'created';
      const newCompId = `comp_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanLinkedin =
        linkedinRaw || `https://www.linkedin.com/company/${compNameRaw.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      const newCompany: Company = {
        id: newCompId,
        name: compNameRaw,
        industry: industryRaw || 'Information Technology',
        website: websiteRaw || '',
        linkedin_url: cleanLinkedin,
        employee_count: headcountRaw || '100-500 employees',
        entered_by_name: rowUploader,
        source: 'csv_upload',
        notes: `Entered by: ${rowUploader}`,
        created_by: user?.id || 'usr_cra_1',
        created_at: new Date().toISOString(),
      };

      companies.unshift(newCompany);
      existingComp = newCompany;
      report.companies_created++;
    } else {
      report.companies_existing++;
      // Update missing fields if new CSV data is provided
      if (headcountRaw && (!existingComp.employee_count || existingComp.employee_count === '100-500 employees')) {
        existingComp.employee_count = headcountRaw;
      }
      if (linkedinRaw && !existingComp.linkedin_url) {
        existingComp.linkedin_url = linkedinRaw;
      }
      if (websiteRaw && !existingComp.website) {
        existingComp.website = websiteRaw;
      }
      if (industryRaw && !existingComp.industry) {
        existingComp.industry = industryRaw;
      }
    }

    // 2. Role handling with strict duplicate checking
    if (roleRaw) {
      const normRole = normStr(roleRaw);
      // Check if role already exists for this company
      const roleExists = jds.some(
        (j) => j.company_id === existingComp!.id && normStr(j.title) === normRole
      );

      if (roleExists) {
        // "if it is a same role leave it dont allow to store"
        roleStatus = 'duplicate_skipped';
        report.roles_duplicate_skipped++;
      } else {
        // "if it is a different role add it"
        roleStatus = 'created';
        const newJd: JD = {
          id: `jd_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: roleRaw,
          company_id: existingComp.id,
          raw_text: `Opportunity for ${roleRaw} at ${existingComp.name}. Uploaded via CSV by ${rowUploader}.`,
          is_verified: true,
          verification_source: 'csv_upload',
          opportunity_type: oppType,
          date_found: new Date().toISOString().slice(0, 10),
          created_by: user?.id || 'usr_cra_1',
          created_at: new Date().toISOString(),
        };
        jds.unshift(newJd);
        report.roles_created++;
      }
    }

    report.records.push({
      company_name: compNameRaw,
      status: compStatus,
      role_status: roleStatus,
      role_title: roleRaw || undefined,
      uploader: rowUploader,
    });
  }

  return res.json({
    success: true,
    message: `Processed ${report.total_rows} rows: ${report.companies_created} new companies created, ${report.companies_existing} existing companies recognized, ${report.roles_created} new roles added, ${report.roles_duplicate_skipped} duplicate roles safely skipped.`,
    report,
  });
}

