/**
 * Robust Company Name Extractor for HTML Job Postings & Resumes
 * Follows strict priority order:
 *  a. JSON-LD JobPosting -> hiringOrganization.name / Organization.name
 *  b. Meta tags: og:site_name, og:title, twitter:title, application-name
 *  c. Known job-site selectors (LinkedIn, Naukri, Indeed, Glassdoor, Wellfound, Internshala, Foundit, ATS)
 *  d. <title> patterns: "Role at Company", "Role - Company", "Company | Role", "Company Careers"
 *  e. Text patterns: "About <Company>", "Company:", "Hiring company", "Posted by"
 *  f. The domain of any canonical link or job URL, cleaned into a readable name (marked "verify")
 */

export interface CompanyExtractionResult {
  company: string;
  stepFound: string;
}

/**
 * Decodes HTML entities (e.g., &amp; -> &, &quot; -> ", &#39; -> ')
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Cleans extracted company name:
 * - Trims whitespace and decodes entities
 * - Removes suffix junk like "Careers", "Jobs", "- LinkedIn", "| Naukri.com"
 * - Removes leading prefixes like "About", "Company:"
 */
export function cleanCompanyName(raw: string): string {
  if (!raw) return '';
  let cleaned = decodeHtmlEntities(raw).trim();

  // Remove trailing site suffixes: e.g. " - LinkedIn", " | Naukri.com", " - Indeed"
  cleaned = cleaned.replace(/\s*[-–|•:]\s*(LinkedIn|Naukri(\.com)?|Indeed|Glassdoor|Wellfound|Internshala|Foundit|Job Portal|Monster).*$/i, '');

  // Remove trailing "Careers", "Jobs", "Openings"
  cleaned = cleaned.replace(/\s*[-–|•]\s*(Careers|Jobs|Hiring|Work with us|Job Openings|Career Opportunities).*$/i, '');
  cleaned = cleaned.replace(/\s+(Careers|Jobs|Hiring Portal|Career Portal|Job Board)$/i, '');

  // Remove leading prefixes: "About <Company>", "Company: <Company>"
  cleaned = cleaned.replace(/^(About\s+(the\s+)?(company|us)?\s*[:\-–]?|Company\s*[:\-–]|Hiring Company\s*[:\-–]|Posted by\s*[:\-–])\s*/i, '');

  // Strip wrapping quotes or brackets
  cleaned = cleaned.replace(/^["'«“]|["'»”]$/g, '').trim();

  return cleaned;
}

export function extractCompanyFromHTML(doc: Document, htmlInput: string = ''): CompanyExtractionResult {
  // -------------------------------------------------------------------------
  // a. JSON-LD JobPosting -> hiringOrganization.name / Organization.name
  // -------------------------------------------------------------------------
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of Array.from(jsonLdScripts)) {
    try {
      const parsed = JSON.parse(script.textContent || '{}');
      const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
      for (const item of items) {
        if (!item) continue;
        const type = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        if (type.includes('JobPosting') && item.hiringOrganization) {
          const orgName = typeof item.hiringOrganization === 'string'
            ? item.hiringOrganization
            : item.hiringOrganization.name;
          if (orgName && typeof orgName === 'string' && orgName.trim().length > 1) {
            return {
              company: cleanCompanyName(orgName),
              stepFound: 'Step a: JSON-LD JobPosting (hiringOrganization.name)',
            };
          }
        }
        if (type.includes('Organization') && item.name && typeof item.name === 'string') {
          if (item.name.trim().length > 1 && !item.name.match(/linkedin|naukri|indeed|glassdoor/i)) {
            return {
              company: cleanCompanyName(item.name),
              stepFound: 'Step a: JSON-LD Organization (name)',
            };
          }
        }
      }
    } catch (_) {}
  }

  // -------------------------------------------------------------------------
  // b. Meta tags: og:site_name, og:title, twitter:title, application-name
  // -------------------------------------------------------------------------
  // b.1 og:site_name
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
                     doc.querySelector('meta[name="og:site_name"]')?.getAttribute('content');
  if (ogSiteName && ogSiteName.trim().length > 1 && !ogSiteName.match(/linkedin|naukri|indeed|glassdoor|internshala|foundit/i)) {
    return {
      company: cleanCompanyName(ogSiteName),
      stepFound: 'Step b: Meta tag (og:site_name)',
    };
  }

  // b.2 application-name
  const appName = doc.querySelector('meta[name="application-name"]')?.getAttribute('content');
  if (appName && appName.trim().length > 1 && !appName.match(/linkedin|naukri|indeed|glassdoor|internshala|foundit/i)) {
    return {
      company: cleanCompanyName(appName),
      stepFound: 'Step b: Meta tag (application-name)',
    };
  }

  // b.3 og:title or twitter:title pattern: "Role at Company"
  const metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
  if (metaTitle) {
    const atMatch = metaTitle.match(/(?:at|@|with)\s+([A-Za-z0-9&.,\s'-]+?)(?:\s*[-–|•]|\s*$)/i);
    if (atMatch && atMatch[1] && atMatch[1].trim().length > 1) {
      const comp = cleanCompanyName(atMatch[1]);
      if (!comp.match(/linkedin|naukri|indeed|glassdoor/i) && comp.length > 1) {
        return {
          company: comp,
          stepFound: 'Step b: Meta tag (og:title/twitter:title "at <Company>")',
        };
      }
    }
  }

  // -------------------------------------------------------------------------
  // c. Known job-site selectors
  // -------------------------------------------------------------------------
  const jobSiteSelectors = [
    // LinkedIn
    '.topcard__org-name-link',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.top-card-layout__first-subline a',
    '.top-card-layout__first-subline',
    'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
    'a[href*="/company/"]',
    // Naukri
    '.jd-header-comp-name a',
    '.jd-header-comp-name',
    '.comp-name',
    'a.comp-name',
    // Indeed
    '[data-testid="inlineHeader-companyName"]',
    '.companyName',
    // Glassdoor
    '.employer-name',
    '[data-test="employer-name"]',
    // Wellfound
    '.company-name',
    // Internshala
    '.link_display_like_text',
    '.company_name',
    // Foundit
    '.company-title',
    // ATS (Greenhouse, Lever, Workday, BambooHR, SmartRecruiters)
    '.app-title',
    '.company-header',
    '.organization-name',
    '.employer-info',
    '.job-company',
    '[data-field="company"]',
    '.company-name',
    '.company',
    '.employer',
    '.org',
    '.organization',
  ];

  for (const sel of jobSiteSelectors) {
    const el = doc.querySelector(sel);
    if (el && el.textContent) {
      const txt = cleanCompanyName(el.textContent);
      if (
        txt &&
        txt.length > 1 &&
        txt.length < 80 &&
        !txt.match(/^(LinkedIn|Naukri|Indeed|Glassdoor|Apply Now|Sign in|Careers|Jobs|About Us|View all|Search)$/i)
      ) {
        return {
          company: txt,
          stepFound: `Step c: Job-site selector (${sel})`,
        };
      }
    }
  }

  // -------------------------------------------------------------------------
  // d. <title> patterns: "Role at Company", "Role - Company", "Company | Role", "Company Careers"
  // -------------------------------------------------------------------------
  const titleTag = doc.querySelector('title')?.textContent || '';
  if (titleTag && titleTag.trim()) {
    const cleanTitle = decodeHtmlEntities(titleTag).trim();

    // d.1 "Role at Company" or "Role @ Company"
    const atMatch = cleanTitle.match(/(?:hiring|looking for)?\s*.*?\s+(?:at|@|with)\s+([A-Za-z0-9&.,\s'-]+?)(?:\s*[-–|•]|\s*$)/i);
    if (atMatch && atMatch[1]) {
      const comp = cleanCompanyName(atMatch[1]);
      if (comp.length > 1 && !comp.match(/linkedin|naukri|indeed|glassdoor/i)) {
        return {
          company: comp,
          stepFound: 'Step d: <title> pattern ("Role at Company")',
        };
      }
    }

    // d.2 "Company | Role" or "Company - Role" or "Company Careers"
    const splitParts = cleanTitle.split(/[-–|•]/).map((s) => cleanCompanyName(s)).filter(Boolean);
    if (splitParts.length >= 2) {
      const p1 = splitParts[0];
      const p2 = splitParts[1];

      if (p2.match(/^(Careers|Jobs|Hiring|Openings|Vacancies)$/i)) {
        return {
          company: p1,
          stepFound: 'Step d: <title> pattern ("Company Careers")',
        };
      }

      const roleRegex = /engineer|developer|recruiter|manager|analyst|intern|specialist|lead|consultant|associate|designer|architect|executive/i;
      if (!p1.match(roleRegex) && p2.match(roleRegex)) {
        if (!p1.match(/linkedin|naukri|indeed|glassdoor/i)) {
          return {
            company: p1,
            stepFound: 'Step d: <title> pattern ("Company | Role")',
          };
        }
      } else if (p1.match(roleRegex) && !p2.match(roleRegex)) {
        if (!p2.match(/linkedin|naukri|indeed|glassdoor/i)) {
          return {
            company: p2,
            stepFound: 'Step d: <title> pattern ("Role - Company")',
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // e. Text patterns: "About <Company>", "Company:", "Hiring company", "Posted by"
  // -------------------------------------------------------------------------
  const fullText = (doc.body?.innerText || doc.body?.textContent || htmlInput);
  const textPatterns = [
    { regex: /(?:About\s+(?:the\s+)?company|About\s+us)\s*[:\-–]?\s*([A-Za-z0-9&.,\s'-]{2,50}?)(?:\n|\r|\.|\s{2,})/i, desc: 'About <Company>' },
    { regex: /(?:Company\s*name|Hiring\s+company|Employer\s*name)\s*[:\-–]\s*([A-Za-z0-9&.,\s'-]{2,50}?)(?:\n|\r|\.|\s{2,})/i, desc: 'Company: <Company>' },
    { regex: /(?:Job\s+posted\s+by|Posted\s+by)\s*[:\-–]\s*([A-Za-z0-9&.,\s'-]{2,50}?)(?:\n|\r|\.|\s{2,})/i, desc: 'Posted by: <Company>' },
    { regex: /join\s+(?:the\s+)?([A-Za-z0-9&.,\s'-]{2,40}?)\s+team/i, desc: 'Join the <Company> team' },
  ];

  for (const { regex, desc } of textPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const comp = cleanCompanyName(match[1]);
      if (
        comp.length > 1 &&
        comp.length < 60 &&
        !comp.match(/^(this role|our client|a leading|the|an|confidential|us|company)$/i)
      ) {
        return {
          company: comp,
          stepFound: `Step e: Text pattern (${desc})`,
        };
      }
    }
  }

  // -------------------------------------------------------------------------
  // f. Canonical link or job URL domain (last resort, marked "verify")
  // -------------------------------------------------------------------------
  const canonicalHref = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
                        doc.querySelector('a[href^="http"]')?.getAttribute('href');
  if (canonicalHref) {
    try {
      const url = new URL(canonicalHref);
      let hostname = url.hostname.replace(/^www\./i, '');
      if (!hostname.match(/linkedin\.com|naukri\.com|indeed\.com|glassdoor\.com|google\.com|wellfound\.com/i)) {
        const parts = hostname.split('.');
        const mainPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
        if (mainPart && mainPart.length > 2) {
          const formatted = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
          return {
            company: `${formatted} (verify)`,
            stepFound: 'Step f: Canonical URL domain extraction',
          };
        }
      }
    } catch (_) {}
  }

  return {
    company: '',
    stepFound: 'None (Company Name missing)',
  };
}
