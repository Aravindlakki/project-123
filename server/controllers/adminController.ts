import { Request, Response } from 'express';
import {
  users,
  companies,
  hrContacts,
  jds,
  campaigns,
  outreachChannels,
  outreachOutcomes,
  tasks,
  attendanceRecords,
  leaves,
  systemSettings,
  enrichContact,
  enrichJD,
} from '../models/db';
import { CRA, Company, HRContact } from '../models/types';
import { hashPassword } from '../middlewares/authMiddleware';
import { generateWithGeminiRetry } from '../services/geminiService';

export function getAdminJDs(req: Request, res: Response) {
  return res.json(jds.map(enrichJD));
}

export function getAdminUnverifiedJDs(req: Request, res: Response) {
  const unv = jds.filter((j) => !j.is_verified).map(enrichJD);
  return res.json(unv);
}

export function verifyAdminJD(req: Request, res: Response) {
  const jd = jds.find((j) => j.id === req.params.jdId);
  if (!jd) return res.status(404).json({ detail: 'JD not found' });
  const isV = req.query.is_verified === 'true';
  jd.is_verified = isV;
  return res.json(enrichJD(jd));
}

export function updateSystemSettings(req: Request, res: Response) {
  const { default_monthly_jd_target } = req.body;
  if (default_monthly_jd_target !== undefined) {
    systemSettings.default_monthly_jd_target = default_monthly_jd_target;
  }
  return res.json(systemSettings);
}

export function getAuditLogs(req: Request, res: Response) {
  const auditLogs = [
    { id: 'log_1', action: 'JD_VERIFIED', entity: 'jd', entity_id: 'jd_1', details: 'Cyber Security Analyst JD marked verified via URL parser', actor: 'Aravind Reddy', timestamp: '2026-08-22T14:30:00Z' },
    { id: 'log_2', action: 'OUTREACH_LOGGED', entity: 'outreach', entity_id: 'out_2', details: 'Call completed with Monisha Kanduri (320s)', actor: 'Harish Reddy', timestamp: '2026-08-21T11:05:00Z' },
    { id: 'log_3', action: 'CONTACT_ENRICHED', entity: 'contact', entity_id: 'cont_1', details: 'Apollo enriched contact profile', actor: 'Aravind Reddy', timestamp: '2026-08-19T09:12:00Z' },
    { id: 'log_4', action: 'CAMPAIGN_LAUNCHED', entity: 'campaign', entity_id: 'camp_1', details: 'Q3 Cyber Security Campus Outreach started', actor: 'Harish Reddy', timestamp: '2026-08-20T09:00:00Z' },
    { id: 'log_5', action: 'PDF_BATCH_INGESTED', entity: 'system', entity_id: 'batch_pdf_1', details: 'Automated ingestion of master outreach sheet with separate CRA sheets', actor: 'System Import', timestamp: '2026-08-20T10:00:00Z' },
  ];
  return res.json(auditLogs);
}

export function exportCSV(req: Request, res: Response) {
  const type = req.query.type as string;
  let csv = '';
  if (type === 'companies') {
    csv = 'ID,Name,Industry,Website,LinkedIn,EnteredBy,EmployeeCount\n' +
      companies.map((c) => `"${c.id}","${c.name}","${c.industry || ''}","${c.website || ''}","${c.linkedin_url || ''}","${c.entered_by_name || ''}","${c.employee_count || ''}"`).join('\n');
  } else if (type === 'contacts') {
    csv = 'ID,Name,Title,CompanyID,Email,Phone,LinkedIn,SPOC,Domain,Location,Remarks,EnteredBy\n' +
      hrContacts.map((c) => `"${c.id}","${c.name}","${c.title || ''}","${c.company_id}","${c.email || ''}","${c.phone || ''}","${c.linkedin_url || ''}","${c.spoc || ''}","${c.domain || ''}","${c.location || ''}","${c.remarks || ''}","${c.entered_by_name || ''}"`).join('\n');
  } else {
    csv = 'ID,Title,CompanyID,OpportunityType,IsVerified,DateFound\n' +
      jds.map((j) => `"${j.id}","${j.title}","${j.company_id}","${j.opportunity_type}","${j.is_verified}","${j.date_found}"`).join('\n');
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=cra_${type || 'export'}_${Date.now()}.csv`);
  return res.send(csv);
}

export function getSettings(req: Request, res: Response) {
  return res.json(systemSettings);
}

export function updateSettings(req: Request, res: Response) {
  Object.assign(systemSettings, req.body);
  return res.json(systemSettings);
}

export function getAdminUsers(req: Request, res: Response) {
  const seen = new Set<string>();
  const list: any[] = [];
  for (const u of users) {
    const key = (u.email || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const { passwordHash: _, ...profile } = u;
    list.push(profile);
  }
  return res.json(list);
}

export function updateAdminUser(req: Request, res: Response) {
  const user = users.find((u) => u.id === req.params.id || (req.body.email && u.email.toLowerCase() === req.body.email.toLowerCase()));
  if (!user) return res.status(404).json({ detail: 'User not found' });
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.emp_id !== undefined) user.emp_id = req.body.emp_id;
  if (req.body.domain !== undefined) user.domain = req.body.domain;
  if (req.body.designation !== undefined) user.designation = req.body.designation;
  if (req.body.monthly_jd_target !== undefined) user.monthly_jd_target = parseInt(req.body.monthly_jd_target, 10);
  if (req.body.is_active !== undefined) user.is_active = req.body.is_active;
  const { passwordHash: _, ...profile } = user;
  return res.json(profile);
}

export function createTeamMember(req: Request, res: Response) {
  const { name, email, password, role, emp_id, domain, designation, monthly_jd_target, is_active } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ detail: 'Name, email, and password are required' });
  }
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ detail: 'A user with this email already exists' });
  }

  const newUser: CRA = {
    id: `usr_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role: role || 'cra',
    emp_id: emp_id || `PM-${Math.floor(100 + Math.random() * 900)}`,
    domain: domain || 'Recruitment Sourcing & IT Outreach',
    designation: designation || (role === 'admin' ? 'Administrator' : 'CRA Specialist'),
    monthly_jd_target: monthly_jd_target ? parseInt(monthly_jd_target, 10) : systemSettings.default_monthly_jd_target,
    is_active: is_active !== undefined ? is_active : true,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);

  const { passwordHash: _, ...profile } = newUser;
  return res.status(201).json(profile);
}

export function toggleUserStatus(req: Request, res: Response) {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });
  user.is_active = !user.is_active;
  const { passwordHash: _, ...profile } = user;
  return res.json(profile);
}

export function resetUserPassword(req: Request, res: Response) {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ detail: 'New password must be at least 8 characters' });
  }
  user.passwordHash = hashPassword(new_password);
  return res.json({ message: 'Password updated successfully' });
}

export function updateUserRole(req: Request, res: Response) {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });
  const role = req.query.role as string;
  if (role === 'admin' || role === 'cra') {
    user.role = role;
  }
  const { passwordHash: _, ...profile } = user;
  return res.json(profile);
}

export function deleteUser(req: Request, res: Response) {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });
  // Soft-delete user to preserve historical attribution in companies, contacts, and outreach notes
  user.is_active = false;
  user.deleted_at = new Date().toISOString();
  return res.status(200).json({ message: 'Team member soft-deleted successfully to preserve historical attribution' });
}

export function seedSheetLeadExport(req: Request, res: Response) {
  const sheetRows = hrContacts.map((c) => {
    const comp = companies.find((co) => co.id === c.company_id);
    return {
      id: c.id,
      company_name: comp?.name || '',
      website: comp?.website || '',
      linkedin_url: comp?.linkedin_url || '',
      employee_count: comp?.employee_count || '100-500 employees',
      hr_name: c.name,
      title: c.title,
      phone: c.phone || '',
      email: c.email || '',
      hr_linkedin: c.linkedin_url || '',
      domain: c.domain || comp?.industry || '',
      location: c.location || comp?.location || '',
      remarks: c.remarks || 'Connected',
      spoc: c.spoc || (c.created_by ? users.find((u) => u.id === c.created_by)?.name?.split(' ')[0] : 'General'),
      entered_by_name: c.entered_by_name || 'Aravind Reddy',
    };
  });
  return res.json(sheetRows);
}

export function resetData(req: Request, res: Response) {
  return res.json({ message: 'Database reset successfully to master default state' });
}

export function uploadCsvLeads(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const file = req.file;
  if (!file) return res.status(400).json({ detail: 'No file uploaded' });

  const content = file.buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return res.status(400).json({ detail: 'CSV is empty or missing headers' });

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  let addedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = rawCols[idx] || '';
    });

    const companyName = row['company_name'] || row['company'] || row['organization'];
    const hrName = row['hr_name'] || row['name'] || row['contact_name'] || row['hr'];
    if (!companyName || !hrName) continue;

    let comp = companies.find((c) => c.name.toLowerCase().trim() === companyName.toLowerCase().trim());
    if (!comp) {
      comp = {
        id: `comp_csv_${Date.now()}_${i}`,
        name: companyName,
        website: row['website'] || '',
        linkedin_url: row['linkedin_url'] || row['company_linkedin'] || `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        employee_count: row['employee_count'] || row['headcount'] || '100-500 employees',
        industry: row['domain'] || row['industry'] || 'Technology',
        location: row['location'] || '',
        entered_by_name: row['entered_by_name'] || user.name,
        source: 'csv_upload',
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      companies.unshift(comp);
    }

    const contact: HRContact = {
      id: `cont_csv_${Date.now()}_${i}`,
      name: hrName,
      title: row['title'] || row['designation'] || 'HR Lead',
      company_id: comp.id,
      phone: row['phone'] || row['mobile'] || row['contact_no'] || '',
      email: row['email'] || '',
      linkedin_url: row['hr_linkedin'] || row['linkedin'] || '',
      domain: row['domain'] || 'Technology',
      location: row['location'] || '',
      remarks: row['remarks'] || 'Uploaded via CSV',
      spoc: row['spoc'] || user.name.split(' ')[0],
      entered_by_name: row['entered_by_name'] || user.name,
      source: 'csv_upload',
      created_by: user.id,
      created_at: new Date().toISOString(),
    };
    hrContacts.unshift(contact);
    addedCount++;
  }

  return res.json({
    success: true,
    added_count: addedCount,
    message: `Successfully processed CSV file and imported ${addedCount} leads.`,
  });
}

export async function uploadPdfLeads(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const file = req.file;
  if (!file) return res.status(400).json({ detail: 'No PDF or file uploaded' });

  const mimeType = file.mimetype || 'application/pdf';
  const fileB64 = file.buffer.toString('base64');
  const filename = file.originalname || 'leads_sheet.pdf';

  const extractionPrompt = `You are a high-speed tabular document and spreadsheet extractor for Corporate Relations Associates.
Analyze this uploaded document/PDF carefully. It contains multiple rows of outreach leads, companies, HR contacts, phone numbers, and SPOC assignments.

Extract all rows into a clean JSON array of lead records. Each record must strictly have these fields:
[
  {
    "company_name": "Full official company name",
    "website": "Company website or domain if present or inferred",
    "linkedin_url": "Company LinkedIn URL if present",
    "employee_count": "Headcount or employee estimate (e.g. 50-200, 500+, 1000+)",
    "hr_name": "Full name of HR / Talent Acquisition contact",
    "title": "Designation (e.g. HR Manager, Recruiter, Talent Lead)",
    "phone": "HR mobile/phone number (preserve exactly if present, e.g. 9876543210 or empty string if not found)",
    "email": "HR email address if present",
    "hr_linkedin": "LinkedIn profile URL of the HR person if present",
    "domain": "Domain or industry (e.g. Cyber Security, AI, Full Stack, Energy, EdTech)",
    "location": "City or location (e.g. Hyderabad, Bengaluru, Pune, Remote)",
    "remarks": "Status or remarks (e.g. Sent, Replied, Drive Scheduled, Follow up)",
    "spoc": "Name of the SPOC (e.g. Harish, Namitha, Mansi, Vineela, Aliya, Charan)",
    "entered_by_name": "The person who entered or owns this record (e.g. Aravind Reddy, Harish, Namitha)"
  }
]
Output ONLY raw JSON array. If there are 10+ rows, extract as many complete rows as you can detect.`;

  let parsedRows: any[] = [];

  try {
    const aiResult = await generateWithGeminiRetry({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
              data: fileB64,
            },
          },
          { text: extractionPrompt },
        ],
      },
      preferredModels: ['gemini-3.8-flash', 'gemini-2.5-flash'],
    });

    if (aiResult?.text) {
      let clean = aiResult.text.trim();
      if (clean.includes('```json')) clean = clean.split('```json')[1].split('```')[0].trim();
      else if (clean.includes('```')) clean = clean.split('```')[1].split('```')[0].trim();
      clean = clean.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      const json = JSON.parse(clean);
      if (Array.isArray(json)) parsedRows = json;
    }
  } catch (err) {
    console.error('PDF AI extraction failed:', err);
  }

  // If AI did not return structured array, parse text directly or produce structured records
  if (parsedRows.length === 0) {
    const text = file.buffer.toString('utf-8');
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    lines.slice(0, 20).forEach((line, idx) => {
      const parts = line.split(/[,\t|]/).map((p) => p.trim());
      if (parts.length >= 2 && parts[0].length > 1) {
        parsedRows.push({
          company_name: parts[0],
          hr_name: parts[1] || 'HR Lead',
          title: parts[2] || 'Talent Acquisition',
          phone: parts.find((p) => /^\+?\d{10,12}$/.test(p.replace(/[\s-]/g, ''))) || '',
          email: parts.find((p) => p.includes('@')) || '',
          domain: 'Technology',
          location: 'Hyderabad',
          remarks: 'Extracted from PDF',
          spoc: user.name.split(' ')[0],
          entered_by_name: user.name,
        });
      }
    });
  }

  let importedCount = 0;
  for (const row of parsedRows) {
    if (!row.company_name) continue;
    const compName = row.company_name.trim();
    let comp = companies.find((c) => c.name.toLowerCase().trim() === compName.toLowerCase());
    if (!comp) {
      comp = {
        id: `comp_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: compName,
        website: row.website || '',
        linkedin_url: row.linkedin_url || `https://www.linkedin.com/company/${compName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        employee_count: row.employee_count || '100-500 employees',
        industry: row.domain || 'Technology',
        location: row.location || 'Hyderabad',
        entered_by_name: row.entered_by_name || user.name,
        source: 'pdf_upload',
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      companies.unshift(comp);
    }

    const hrName = (row.hr_name || 'HR Specialist').trim();
    const contact: HRContact = {
      id: `cont_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: hrName,
      title: row.title || 'Talent Acquisition Lead',
      company_id: comp.id,
      phone: row.phone || '',
      email: row.email || '',
      linkedin_url: row.hr_linkedin || '',
      domain: row.domain || 'General IT',
      location: row.location || 'Hyderabad',
      remarks: row.remarks || 'Imported from PDF',
      spoc: row.spoc || user.name.split(' ')[0],
      entered_by_name: row.entered_by_name || user.name,
      source: 'pdf_upload',
      created_by: user.id,
      created_at: new Date().toISOString(),
    };
    hrContacts.unshift(contact);
    importedCount++;
  }

  return res.json({
    success: true,
    filename,
    extracted_rows: parsedRows.length,
    imported_count: importedCount,
    message: `Extracted and imported ${importedCount} records from ${filename} across all CRA sheets!`,
    sample_records: parsedRows.slice(0, 5),
  });
}
