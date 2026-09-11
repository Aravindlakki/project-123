import { Request, Response } from 'express';
import { hrContacts, companies, enrichContact } from '../models/db';
import { HRContact, Company, CRA } from '../models/types';

export function getWorksheetLeads(req: Request, res: Response) {
  const { spoc, domain, remarks, search } = req.query;
  let results = hrContacts.map(enrichContact);

  if (spoc && spoc !== 'all') {
    const spocStr = String(spoc).toLowerCase().trim();
    results = results.filter((c) => {
      const contactSpoc = (c.spoc || '').toLowerCase().trim();
      const enteredBy = (c.entered_by_name || '').toLowerCase().trim();
      return contactSpoc === spocStr || enteredBy.includes(spocStr);
    });
  }

  if (domain && domain !== 'all') {
    const domStr = String(domain).toLowerCase().trim();
    results = results.filter((c) => (c.domain || '').toLowerCase().includes(domStr));
  }

  if (remarks && remarks !== 'all') {
    const remStr = String(remarks).toLowerCase().trim();
    results = results.filter((c) => (c.remarks || '').toLowerCase() === remStr);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    results = results.filter((c) => {
      const compName = (c.company?.name || '').toLowerCase();
      const hrName = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const domainVal = (c.domain || '').toLowerCase();
      const locVal = (c.location || '').toLowerCase();
      return (
        compName.includes(q) ||
        hrName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        domainVal.includes(q) ||
        locVal.includes(q)
      );
    });
  }

  return res.json(results);
}

export function createWorksheetLead(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const {
    company_name,
    website,
    linkedin_url,
    employee_count,
    industry,
    hr_name,
    title,
    phone,
    email,
    hr_linkedin,
    domain,
    location,
    remarks,
    spoc,
    entered_by_name,
  } = req.body;

  if (!company_name || !hr_name) {
    return res.status(400).json({ detail: 'Company name and HR name are required' });
  }

  // Find or create company
  let comp = companies.find((c) => c.name.toLowerCase().trim() === company_name.toLowerCase().trim());
  if (!comp) {
    comp = {
      id: `comp_lead_${Date.now()}`,
      name: company_name.trim(),
      website: website?.trim(),
      linkedin_url: linkedin_url?.trim() || `https://www.linkedin.com/company/${company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      employee_count: employee_count?.trim() || '100-500 employees',
      industry: industry?.trim() || domain?.trim() || 'Technology',
      location: location?.trim(),
      entered_by_name: entered_by_name?.trim() || user.name,
      source: 'manual',
      created_by: user.id,
      created_at: new Date().toISOString(),
    };
    companies.unshift(comp);
  } else {
    // Update company details if provided
    if (employee_count) comp.employee_count = employee_count;
    if (linkedin_url) comp.linkedin_url = linkedin_url;
    if (website) comp.website = website;
  }

  const newContact: HRContact = {
    id: `cont_lead_${Date.now()}`,
    name: hr_name.trim(),
    title: title?.trim() || 'HR Specialist',
    company_id: comp.id,
    phone: phone?.trim(),
    email: email?.trim(),
    linkedin_url: hr_linkedin?.trim(),
    domain: domain?.trim() || 'General IT',
    location: location?.trim() || 'Hyderabad',
    remarks: remarks?.trim() || 'Pending',
    spoc: spoc?.trim() || user.name.split(' ')[0],
    entered_by_name: entered_by_name?.trim() || user.name,
    source: 'manual',
    created_by: user.id,
    created_at: new Date().toISOString(),
  };

  hrContacts.unshift(newContact);
  return res.status(201).json(enrichContact(newContact));
}
