/**
 * Production-grade CSV, TSV & Spreadsheet parser for HR contacts
 * Supports RFC-4180 quotes, auto-detected delimiters (comma, tab, semicolon, pipe),
 * intelligent header detection and mapping, and fallback heuristics for unlabelled data.
 */

export interface ParsedContactRow {
  id: string;
  name: string;
  title: string;
  company_name?: string;
  company_id?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  isValid: boolean;
  warnings: string[];
}

/**
 * Split text into records and fields adhering to RFC-4180 (handling quoted fields with newlines/commas)
 */
export function parseDelimitedText(text: string): { rows: string[][]; delimiter: string } {
  if (!text || !text.trim()) return { rows: [], delimiter: ',' };

  // 1. Detect delimiter by inspecting the first few lines
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n');
  const counts = {
    tab: (firstLines.match(/\t/g) || []).length,
    comma: (firstLines.match(/,/g) || []).length,
    semicolon: (firstLines.match(/;/g) || []).length,
    pipe: (firstLines.match(/\|/g) || []).length,
  };

  let delimiter = ',';
  if (counts.tab > counts.comma && counts.tab > counts.semicolon) {
    delimiter = '\t';
  } else if (counts.semicolon > counts.comma && counts.semicolon > counts.tab) {
    delimiter = ';';
  } else if (counts.pipe > counts.comma && counts.pipe > counts.semicolon) {
    delimiter = '|';
  }

  // 2. Parse character by character with state machine
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Final flush
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return { rows, delimiter };
}

interface ColumnMap {
  nameCol: number;
  firstNameCol: number;
  lastNameCol: number;
  titleCol: number;
  companyCol: number;
  emailCol: number;
  phoneCol: number;
  linkedinCol: number;
  companyLinkedinCol: number;
  websiteCol: number;
  headcountCol: number;
  domainCol: number;
  locationCol: number;
  spocCol: number;
  uploaderCol: number;
}

/**
 * Intelligent, multi-pass column header resolver
 * Resolves complex sheets (like PLACEMEIN daily exports) where "Company Name",
 * "Company LinkedIn", "HR Contact Name", and "HR LinkedIn" coexist.
 */
function resolveColumns(rawHeaders: string[]): { colMap: ColumnMap; matchedCount: number } {
  const norm = rawHeaders.map((h, idx) => ({
    orig: h,
    idx,
    clean: h.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim(),
  }));

  const colMap: ColumnMap = {
    nameCol: -1,
    firstNameCol: -1,
    lastNameCol: -1,
    titleCol: -1,
    companyCol: -1,
    emailCol: -1,
    phoneCol: -1,
    linkedinCol: -1,
    companyLinkedinCol: -1,
    websiteCol: -1,
    headcountCol: -1,
    domainCol: -1,
    locationCol: -1,
    spocCol: -1,
    uploaderCol: -1,
  };

  let matchedCount = 0;

  // Pass 1: Specific, multi-word or unambiguous headers
  norm.forEach(({ clean, idx }) => {
    if (clean.includes('company linkedin') || clean.includes('org linkedin')) {
      colMap.companyLinkedinCol = idx;
      matchedCount++;
    } else if (clean.includes('hr linkedin') || clean.includes('contact linkedin') || clean.includes('profile link') || clean.includes('profile url')) {
      colMap.linkedinCol = idx;
      matchedCount++;
    } else if (clean.includes('hr contact name') || clean.includes('contact name') || clean.includes('hr name') || clean.includes('recruiter name') || clean.includes('candidate name') || clean.includes('person name') || clean.includes('talent name')) {
      colMap.nameCol = idx;
      matchedCount++;
    } else if (clean.includes('first name') || clean.includes('firstname')) {
      colMap.firstNameCol = idx;
      matchedCount++;
    } else if (clean.includes('last name') || clean.includes('lastname') || clean.includes('surname')) {
      colMap.lastNameCol = idx;
      matchedCount++;
    } else if (clean.includes('company name') || clean.includes('organization name') || clean.includes('org name') || clean.includes('firm name')) {
      colMap.companyCol = idx;
      matchedCount++;
    } else if (clean.includes('employee headcount') || clean.includes('employee count') || clean.includes('team size') || clean === 'headcount') {
      colMap.headcountCol = idx;
      matchedCount++;
    } else if (clean.includes('designation') || clean.includes('job title') || clean.includes('job role') || clean === 'role title') {
      colMap.titleCol = idx;
      matchedCount++;
    } else if (clean.includes('phone number') || clean.includes('mobile number') || clean.includes('contact no') || clean.includes('phone no') || clean.includes('mobile no')) {
      colMap.phoneCol = idx;
      matchedCount++;
    } else if (clean.includes('email id') || clean.includes('email address') || clean.includes('work email') || clean.includes('contact email')) {
      colMap.emailCol = idx;
      matchedCount++;
    } else if (clean.includes('entered by') || clean.includes('uploaded by')) {
      colMap.uploaderCol = idx;
      matchedCount++;
    } else if (clean === 'spoc' || clean.includes('assigned spoc')) {
      colMap.spocCol = idx;
      matchedCount++;
    } else if (clean.includes('company website') || (clean === 'website' && !clean.includes('hr'))) {
      colMap.websiteCol = idx;
      matchedCount++;
    } else if (clean === 'location' || clean.includes('city') || clean.includes('work location')) {
      colMap.locationCol = idx;
      matchedCount++;
    } else if (clean === 'domain' || clean === 'industry' || clean.includes('sector') || clean.includes('industry domain')) {
      colMap.domainCol = idx;
      matchedCount++;
    }
  });

  // Pass 2: Single-word fallbacks for unassigned columns
  norm.forEach(({ clean, idx }) => {
    // Company fallback
    if (colMap.companyCol === -1 && (clean === 'company' || clean === 'organization' || clean === 'firm' || clean === 'employer' || clean === 'org')) {
      colMap.companyCol = idx;
      matchedCount++;
    }
    // Person Name fallback (ensure not company)
    if (colMap.nameCol === -1 && !clean.includes('company') && !clean.includes('org') && (clean === 'name' || clean === 'fullname' || clean === 'recruiter' || clean === 'person' || clean === 'contact')) {
      colMap.nameCol = idx;
      matchedCount++;
    }
    // Title / role fallback
    if (colMap.titleCol === -1 && (clean === 'title' || clean === 'role' || clean === 'position' || clean === 'headline')) {
      colMap.titleCol = idx;
      matchedCount++;
    }
    // Email fallback
    if (colMap.emailCol === -1 && (clean.includes('email') || clean === 'mail')) {
      colMap.emailCol = idx;
      matchedCount++;
    }
    // Phone fallback
    if (colMap.phoneCol === -1 && (clean.includes('phone') || clean.includes('mobile') || clean.includes('whatsapp') || clean === 'cell' || clean === 'tel')) {
      colMap.phoneCol = idx;
      matchedCount++;
    }
    // LinkedIn fallback (if not already company linkedin)
    if (colMap.linkedinCol === -1 && idx !== colMap.companyLinkedinCol && (clean.includes('linkedin') || clean === 'social')) {
      colMap.linkedinCol = idx;
      matchedCount++;
    }
    // Website fallback
    if (colMap.websiteCol === -1 && (clean === 'website' || clean === 'site' || clean === 'url')) {
      colMap.websiteCol = idx;
      matchedCount++;
    }
  });

  return { colMap, matchedCount };
}

/**
 * Parses raw text or CSV content into structured HRContact objects
 */
export function parseHRContactsCSV(
  content: string,
  defaultCompany?: { id: string; name: string }
): { contacts: ParsedContactRow[]; hasHeaders: boolean; delimiter: string } {
  const { rows, delimiter } = parseDelimitedText(content);
  if (rows.length === 0) return { contacts: [], hasHeaders: false, delimiter };

  const firstRow = rows[0];
  const { colMap, matchedCount } = resolveColumns(firstRow);

  const hasHeaders = matchedCount >= 1 || firstRow.some((c) => /email|name|phone|title|company|domain|linkedin/i.test(c));
  const dataRows = hasHeaders ? rows.slice(1) : rows;

  const results: ParsedContactRow[] = [];

  dataRows.forEach((row, rowIdx) => {
    if (row.length === 0 || row.every((c) => !c.trim())) return;

    let name = '';
    let title = '';
    let companyName = defaultCompany?.name || '';
    let email = '';
    let phone = '';
    let linkedinUrl = '';
    const warnings: string[] = [];

    if (hasHeaders) {
      if (colMap.nameCol !== -1 && row[colMap.nameCol]) {
        name = row[colMap.nameCol];
      } else if (colMap.firstNameCol !== -1) {
        const fn = row[colMap.firstNameCol] || '';
        const ln = colMap.lastNameCol !== -1 ? row[colMap.lastNameCol] || '' : '';
        name = `${fn} ${ln}`.trim();
      }

      if (colMap.titleCol !== -1 && row[colMap.titleCol]) {
        title = row[colMap.titleCol];
      }
      if (colMap.companyCol !== -1 && row[colMap.companyCol]) {
        companyName = row[colMap.companyCol];
      }
      if (colMap.emailCol !== -1 && row[colMap.emailCol]) {
        email = row[colMap.emailCol];
      }
      if (colMap.phoneCol !== -1 && row[colMap.phoneCol]) {
        phone = row[colMap.phoneCol];
      }
      if (colMap.linkedinCol !== -1 && row[colMap.linkedinCol]) {
        linkedinUrl = row[colMap.linkedinCol];
      }
    }

    // Heuristic fallbacks if columns weren't identified or for missing fields
    const assignedIndices = new Set(
      [
        colMap.nameCol,
        colMap.firstNameCol,
        colMap.lastNameCol,
        colMap.titleCol,
        colMap.companyCol,
        colMap.emailCol,
        colMap.phoneCol,
        colMap.linkedinCol,
        colMap.companyLinkedinCol,
        colMap.websiteCol,
      ].filter((idx) => idx !== -1)
    );

    const unassignedCells = row.filter((_, idx) => !hasHeaders || !assignedIndices.has(idx));

    for (const cell of unassignedCells) {
      const trimmed = cell.trim();
      if (!trimmed) continue;

      // Check email
      if (!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        email = trimmed;
        continue;
      }

      // Check LinkedIn / URL
      if (!linkedinUrl && trimmed.includes('linkedin.com/in/')) {
        linkedinUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        continue;
      }

      // Check phone (8 to 18 digits/dashes/spaces/plus)
      if (!phone && /^[+]?[\d\s-().]{8,18}$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 8) {
        phone = trimmed;
        continue;
      }

      // Check name / title if not set
      if (!name && !hasHeaders) {
        name = trimmed;
      } else if (!title && (hasHeaders || name)) {
        if (/talent|hr|recruiter|lead|director|manager|specialist|officer|head/i.test(trimmed)) {
          title = trimmed;
        } else if (!title) {
          title = trimmed;
        }
      }
    }

    // Default title if still empty
    if (!title) {
      title = 'Talent Acquisition';
    }

    // Clean values
    name = name.replace(/^["']|["']$/g, '').trim();
    title = title.replace(/^["']|["']$/g, '').trim();
    companyName = companyName.replace(/^["']|["']$/g, '').trim();
    email = email.replace(/^["']|["']$/g, '').trim();
    phone = phone.replace(/^["']|["']$/g, '').trim();
    linkedinUrl = linkedinUrl.replace(/^["']|["']$/g, '').trim();

    // Auto-fallback: if company exists but contact name was blank, default to 'Talent Acquisition Team'
    if (!name && (companyName || email || phone)) {
      name = 'Talent Acquisition Team';
      warnings.push('Defaulted contact name to Talent Acquisition Team');
    } else if (!name) {
      warnings.push('Missing contact name');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      warnings.push('Invalid email format');
    }
    if (!email && !phone && !linkedinUrl) {
      warnings.push('No direct contact info (email, phone, or LinkedIn)');
    }

    results.push({
      id: `row_${rowIdx}_${Date.now()}`,
      name,
      title,
      company_name: companyName || defaultCompany?.name || 'Target Company',
      company_id: defaultCompany?.id,
      email: email || undefined,
      phone: phone || undefined,
      linkedin_url: linkedinUrl || undefined,
      isValid: Boolean(name && name.length >= 2),
      warnings,
    });
  });

  return { contacts: results, hasHeaders, delimiter };
}

/**
 * Generates a downloadable CSV sample template
 */
export function generateSampleCSV(): string {
  const headers = ['Company', 'Name', 'Title', 'Email', 'Phone', 'LinkedIn URL'];
  const rows = [
    ['Palo Alto Networks', 'Radhika Sharma', 'Senior Tech Recruiter', 'radhika.s@paloaltonetworks.com', '+91 98765 43210', 'https://www.linkedin.com/in/radhika-sharma'],
    ['OATI', 'Vikram Patel', 'Talent Acquisition Lead', 'vikram.patel@oati.com', '+91 98765 43211', 'https://www.linkedin.com/in/vikram-patel'],
    ['CrowdStrike', 'Varun Joshi', 'Campus Relations Lead', 'varun.joshi@crowdstrike.com', '+91 98765 43212', 'https://www.linkedin.com/in/varunjoshi'],
    ['Techolution', 'Steven Lobu', 'Talent Acquisition', 'steven@techolution.com', '+91 88068 03989', 'https://www.linkedin.com/in/stevenlobu'],
  ];

  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
}
