/**
 * Intelligent file type detection and routing logic.
 * Differentiates between LEAD LIST (contacts, candidates, recruiters for HR sourcing)
 * and JD (Job Description mandate for JD List & intake).
 */

export type UploadCategory = 'LEAD_LIST' | 'JD';

export interface FileClassificationResult {
  category: UploadCategory;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  leadIndicatorsCount: number;
  jdIndicatorsCount: number;
}

const JD_KEYWORDS = [
  'job description',
  'responsibilities',
  'qualifications',
  'requirements',
  'key skills',
  'experience required',
  'about the job',
  'job summary',
  'role overview',
  'what you will do',
  'what we are looking for',
  'salary range',
  'ctc',
  'years of experience',
  'educational qualification',
  'b.tech',
  'btech',
  'mca',
  'must have',
  'good to have',
  'job posting',
  'hiring for',
];

const LEAD_LIST_KEYWORDS = [
  'candidate',
  'recruiter',
  'hr name',
  'hr contact',
  'contact person',
  'sourcing list',
  'lead list',
  'talent pool',
  'mobile number',
  'phone number',
  'phone',
  'spoc',
  'entered by',
  'designation',
  'headcount',
  'company domain',
  'remarks',
  'linkedin url',
  'email id',
  'worksheets',
];

export async function detectFileCategory(
  file: File,
  forcedCategory?: UploadCategory
): Promise<FileClassificationResult> {
  if (forcedCategory) {
    return {
      category: forcedCategory,
      confidence: 'high',
      reason: `Manually tagged as ${forcedCategory === 'LEAD_LIST' ? 'Lead List (HR Sourcing)' : 'Job Description (JD)'} by user`,
      suggestedAction: forcedCategory === 'LEAD_LIST' ? 'Route to HR Sourcing flow' : 'Route to JD Intake flow',
      leadIndicatorsCount: 0,
      jdIndicatorsCount: 0,
    };
  }

  const fileNameLower = file.name.toLowerCase();

  // 1. Check filename signatures
  let jdScore = 0;
  let leadScore = 0;

  if (
    fileNameLower.includes('jd') ||
    fileNameLower.includes('job_description') ||
    fileNameLower.includes('job-description') ||
    fileNameLower.includes('mandate') ||
    fileNameLower.includes('posting')
  ) {
    jdScore += 3;
  }

  if (
    fileNameLower.includes('lead') ||
    fileNameLower.includes('contact') ||
    fileNameLower.includes('hr_list') ||
    fileNameLower.includes('sourcing') ||
    fileNameLower.includes('roster') ||
    fileNameLower.includes('worksheet') ||
    fileNameLower.includes('sheet')
  ) {
    leadScore += 3;
  }

  // 2. Sample content signature if readable text
  try {
    const textSample = (await file.slice(0, 15000).text()).toLowerCase();

    for (const kw of JD_KEYWORDS) {
      if (textSample.includes(kw)) {
        jdScore += 1;
      }
    }

    for (const kw of LEAD_LIST_KEYWORDS) {
      if (textSample.includes(kw)) {
        leadScore += 1;
      }
    }

    // Check for phone number density and email density
    const emailMatches = textSample.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const phoneMatches = textSample.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\b[6-9]\d{9}\b/g) || [];

    if (emailMatches.length > 2 || phoneMatches.length > 2) {
      leadScore += 4; // Multiple contacts is a classic lead list signature
    }
  } catch {
    // If binary file (pdf/docx), rely primarily on name or header
  }

  if (leadScore > jdScore) {
    return {
      category: 'LEAD_LIST',
      confidence: leadScore >= 4 ? 'high' : 'medium',
      reason: `File matches Lead List signature (${leadScore} indicators: contact fields, emails, or roster structure)`,
      suggestedAction: 'Route to HR Sourcing (triggers HR contact sourcing flow)',
      leadIndicatorsCount: leadScore,
      jdIndicatorsCount: jdScore,
    };
  }

  return {
    category: 'JD',
    confidence: jdScore >= 3 ? 'high' : 'medium',
    reason: `File matches Job Description signature (${jdScore} indicators: job requirements, skills, or single role mandate)`,
    suggestedAction: 'Route to JD List & Database (JD-only, no HR sourcing triggered)',
    leadIndicatorsCount: leadScore,
    jdIndicatorsCount: jdScore,
  };
}
