import { Request, Response } from 'express';
import { hrContacts, companies, enrichContact } from '../models/db';
import { HRContact, CRA } from '../models/types';
import { searchHRWithGoogleSearch } from '../services/geminiService';

export function getContacts(req: Request, res: Response) {
  const companyId = req.query.company_id as string;
  let list = hrContacts.map(enrichContact);
  if (companyId) {
    list = list.filter((c) => c.company_id === companyId);
  }
  return res.json(list);
}

export function createContact(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { name, title, company_id, email, phone, linkedin_url, source, entered_by_name } = req.body;
  if (!name || !company_id) {
    return res.status(400).json({ detail: 'Contact name and company are required' });
  }
  const newContact: HRContact = {
    id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    title: title || 'HR Lead / Talent Acquisition',
    company_id,
    email: email?.trim(),
    phone: phone?.trim(),
    linkedin_url: linkedin_url?.trim(),
    source: source || 'manual',
    entered_by_name: entered_by_name || user.name || 'Aravind Reddy',
    created_by: user.id,
    created_at: new Date().toISOString(),
  };
  hrContacts.unshift(newContact);
  return res.status(201).json(enrichContact(newContact));
}

export function enrichContactFromApollo(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const name = req.query.name as string;
  const companyName = req.query.company_name as string;
  const companyId = req.query.company_id as string;

  let comp = companyId ? companies.find((c) => c.id === companyId) : undefined;
  if (!comp && companyName) {
    comp = companies.find((c) => c.name.toLowerCase() === companyName.toLowerCase());
    if (!comp) {
      comp = {
        id: `comp_${Date.now()}`,
        name: companyName,
        source: 'apollo',
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      companies.push(comp);
    }
  }

  const cleanName = name || 'HR Professional';
  const domain = comp ? comp.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : 'company.com';
  const newContact: HRContact = {
    id: `cont_${Date.now()}`,
    name: cleanName,
    title: 'Senior Talent Acquisition Specialist',
    company_id: comp?.id || companies[0]?.id || 'comp_1',
    email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@${domain}`,
    phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
    linkedin_url: `https://www.linkedin.com/in/${cleanName.toLowerCase().replace(/\s+/g, '-')}`,
    source: 'apollo',
    created_by: user.id,
    created_at: new Date().toISOString(),
  };
  hrContacts.unshift(newContact);
  return res.json(enrichContact(newContact));
}

export function manualLinkedIn(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const name = req.query.name as string;
  const companyId = req.query.company_id as string;
  const linkedinUrl = req.query.linkedin_url as string;
  const title = req.query.title as string;

  const newContact: HRContact = {
    id: `cont_${Date.now()}`,
    name: name || 'LinkedIn Contact',
    title: title || 'Talent Sourcing Specialist',
    company_id: companyId || companies[0]?.id || 'comp_1',
    linkedin_url: linkedinUrl,
    source: 'linkedin',
    created_by: user.id,
    created_at: new Date().toISOString(),
  };
  hrContacts.unshift(newContact);
  return res.json(enrichContact(newContact));
}

export async function searchHRGoogle(req: Request, res: Response) {
  const companyName = (req.body?.company_name || req.query.company_name) as string;
  const contactName = (req.body?.contact_name || req.query.contact_name) as string;
  const roleFocus = (req.body?.role_focus || req.query.role_focus) as string;
  const companyId = (req.body?.company_id || req.query.company_id) as string;

  if (!companyName && !companyId) {
    return res.status(400).json({ detail: 'company_name or company_id is required' });
  }

  let comp = companyId ? companies.find((c) => c.id === companyId) : undefined;
  const targetCompanyName = companyName || comp?.name || 'Target Company';

  try {
    const searchResult = await searchHRWithGoogleSearch({
      company_name: targetCompanyName,
      contact_name: contactName,
      role_focus: roleFocus,
    });

    return res.json({
      success: true,
      company_id: comp?.id,
      company_name: targetCompanyName,
      ...searchResult,
      phone_policy_note: 'Phone numbers are left blank for manual entry per privacy rules.',
    });
  } catch (err: any) {
    console.error('search-hr-google error:', err);
    return res.status(500).json({
      detail: err?.message || 'Failed to search HR details via Google Search',
    });
  }
}

export function autofillFromGoogle(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { name, title, company_name, company_id, email, phone, linkedin_url } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ detail: 'Contact name is required' });
  }

  let comp = company_id ? companies.find((c) => c.id === company_id) : undefined;
  if (!comp && company_name) {
    comp = companies.find((c) => c.name.toLowerCase() === company_name.toLowerCase());
    if (!comp) {
      comp = {
        id: `comp_${Date.now()}`,
        name: company_name,
        source: 'google_search',
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      companies.push(comp);
    }
  }

  const newContact: HRContact = {
    id: `cont_${Date.now()}`,
    name: name.trim(),
    title: title?.trim() || 'Talent Acquisition',
    company_id: comp?.id || company_id || companies[0]?.id || 'comp_1',
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined, // Left empty per user request unless manually entered
    linkedin_url: linkedin_url?.trim() || undefined,
    source: 'google_search',
    created_by: user.id,
    created_at: new Date().toISOString(),
  };

  hrContacts.unshift(newContact);
  return res.status(201).json(enrichContact(newContact));
}

export function bulkContacts(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { company_id: defaultCompanyId, contacts: contactList } = req.body;
  if (!Array.isArray(contactList)) {
    return res.status(400).json({ detail: 'contacts array is required' });
  }

  const created: HRContact[] = [];
  for (const item of contactList) {
    if (!item.name || !item.name.trim()) continue;

    let targetCompId = item.company_id || defaultCompanyId;

    if (!targetCompId && item.company_name) {
      const trimmedName = item.company_name.trim();
      let matchedComp = companies.find(
        (c) => c.name.toLowerCase().trim() === trimmedName.toLowerCase()
      );
      if (!matchedComp) {
        matchedComp = {
          id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: trimmedName,
          industry: item.industry || 'Technology',
          website: item.company_website,
          source: 'import',
          created_by: user.id,
          created_at: new Date().toISOString(),
        };
        companies.push(matchedComp);
      }
      targetCompId = matchedComp.id;
    }

    if (!targetCompId) {
      targetCompId = companies[0]?.id || 'comp_1';
    }

    const newContact: HRContact = {
      id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: item.name.trim(),
      title: item.title?.trim() || 'Talent Acquisition Specialist',
      company_id: targetCompId,
      email: item.email?.trim() || undefined,
      phone: item.phone?.trim() || undefined,
      linkedin_url: item.linkedin_url?.trim() || undefined,
      source: item.source || 'import',
      created_by: user.id,
      created_at: new Date().toISOString(),
    };
    hrContacts.unshift(newContact);
    created.push(newContact);
  }
  return res.json({ created: created.map(enrichContact), count: created.length });
}

export function getContactById(req: Request, res: Response) {
  const c = hrContacts.find((item) => item.id === req.params.id);
  if (!c) return res.status(404).json({ detail: 'Contact not found' });
  return res.json(enrichContact(c));
}

export function updateContact(req: Request, res: Response) {
  const c = hrContacts.find((item) => item.id === req.params.id);
  if (!c) return res.status(404).json({ detail: 'Contact not found' });
  Object.assign(c, req.body);
  return res.json(enrichContact(c));
}

export function deleteContact(req: Request, res: Response) {
  const idx = hrContacts.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Contact not found' });
  hrContacts.splice(idx, 1);
  return res.status(204).send();
}
