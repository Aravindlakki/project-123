/**
 * Intelligently separates and validates Company Name and Job Role / Title.
 * Guarantees Company name -> company field and Job role/title -> role field.
 * Detects and automatically corrects inverted or swapped company/role mappings.
 */
export const sanitizeCompanyAndRole = (
  rawComp: string,
  rawRole: string
): { company: string; role: string; wasSwapped: boolean } => {
  let company = (rawComp || '').trim();
  let role = (rawRole || '').trim();

  const roleKeywords = [
    'developer', 'engineer', 'recruiter', 'manager', 'lead', 'analyst', 'specialist',
    'officer', 'executive', 'consultant', 'coordinator', 'director', 'associate',
    'architect', 'talent acquisition', 'sourcing', 'intern', 'head of', 'vp',
    'president', 'administrator', 'trainee', 'programmer', 'designer', 'scientist',
    'devops', 'tester', 'qa', 'scrum master', 'product manager', 'hr partner',
    'hr generalist', 'hr specialist', 'recruitment', 'advisor', 'staff'
  ];

  const companyKeywords = [
    'technologies', 'technology', 'services', 'solutions', 'inc', 'ltd', 'limited',
    'pvt', 'corp', 'corporation', 'enterprises', 'systems', 'consulting', 'group',
    'holdings', 'labs', 'software', 'bank', 'infotech', 'networks', 'global',
    'industries', 'studio', 'agency', 'company', 'ventures', 'analytics', 'tcs',
    'infosys', 'wipro', 'google', 'microsoft', 'amazon', 'cisco', 'accenture',
    'cognizant', 'hcl', 'capgemini', 'oracle', 'salesforce', 'autoliv', 'zs'
  ];

  const lowerComp = company.toLowerCase();
  const lowerRole = role.toLowerCase();

  const compHasRoleSignal = roleKeywords.some((kw) => lowerComp.includes(kw));
  const roleHasCompSignal = companyKeywords.some((kw) => lowerRole.includes(kw));
  const compHasCompSignal = companyKeywords.some((kw) => lowerComp.includes(kw));
  const roleHasRoleSignal = roleKeywords.some((kw) => lowerRole.includes(kw));

  let wasSwapped = false;
  // If company field contains strong role keywords and lacks company keywords,
  // or role field contains company keywords and lacks role keywords:
  if ((compHasRoleSignal && !compHasCompSignal) || (roleHasCompSignal && !roleHasRoleSignal)) {
    const temp = company;
    company = role;
    role = temp;
    wasSwapped = true;
  }

  // Strip prefixes like "Company: " or "Role: "
  company = company.replace(/^(company|org|employer|client)\s*[:\-]\s*/i, '').trim();
  role = role.replace(/^(role|title|designation|position|job)\s*[:\-]\s*/i, '').trim();

  return { company, role, wasSwapped };
};
