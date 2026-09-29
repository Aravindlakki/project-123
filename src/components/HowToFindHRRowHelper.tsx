import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Mail,
  UserCheck,
  CheckSquare,
  Sparkles,
  MessageSquare,
  Globe,
  AlertTriangle,
  AtSign,
} from 'lucide-react';

interface HowToFindHRRowHelperProps {
  company: string;
  hrName?: string;
  role?: string;
  craName?: string;
}

/**
 * Strips legal entity and noise words: Pvt, Private, Ltd, Limited, LLP, Inc, Technologies, Solutions, etc.
 */
export function getShortCompanyName(company: string): string {
  if (!company) return '';
  return company
    .replace(/\b(Pvt\.?|Private|Ltd\.?|Limited|LLP|Inc\.?|Incorporated|Technologies|Technology|Solutions|Services|Group|Holdings|Corp\.?|Corporation)\b/gi, '')
    .replace(/[.,\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const HowToFindHRRowHelper: React.FC<HowToFindHRRowHelperProps> = ({
  company,
  hrName,
  role,
  craName = 'Campus Placement Team',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanComp = (company || '').trim();
  const shortComp = getShortCompanyName(cleanComp);
  const showShortName = Boolean(
    shortComp &&
    cleanComp &&
    shortComp.toLowerCase() !== cleanComp.toLowerCase() &&
    shortComp.length >= 2
  );

  const cleanHR = (hrName || '').trim() || 'Hiring Manager';
  const cleanRole = (role || '').trim() || 'Open Positions';

  // a. LinkedIn people: https://www.linkedin.com/search/results/people/?keywords=<encodeURIComponent(company)> HR OR "talent acquisition" OR recruiter
  const linkedinPeopleUrl = cleanComp
    ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanComp)}%20HR%20OR%20"talent%20acquisition"%20OR%20recruiter`
    : '';

  // b. Google X-ray: site:linkedin.com/in "<company>" ("HR" OR "Talent Acquisition" OR "Recruiter" OR "HR Manager")
  const googleXRayQuery = cleanComp
    ? `site:linkedin.com/in "${cleanComp}" ("HR" OR "Talent Acquisition" OR "Recruiter" OR "HR Manager")`
    : '';
  const googleXRayUrl = cleanComp
    ? `https://www.google.com/search?q=${encodeURIComponent(googleXRayQuery)}`
    : '';

  // c. Second X-ray using cleaned short company name: Short name search
  const shortXRayQuery = showShortName
    ? `site:linkedin.com/in "${shortComp}" ("HR" OR "Talent Acquisition" OR "Recruiter" OR "HR Manager")`
    : '';
  const shortXRayUrl = showShortName
    ? `https://www.google.com/search?q=${encodeURIComponent(shortXRayQuery)}`
    : '';

  // d. Google: "<company>" careers contact HR email
  const careersQuery = cleanComp ? `"${cleanComp}" careers contact HR email` : '';
  const careersSearchUrl = cleanComp
    ? `https://www.google.com/search?q=${encodeURIComponent(careersQuery)}`
    : '';

  // e. Email pattern search: "<company>" email format OR "email pattern" site:rocketreach.co OR site:hunter.io
  const emailPatternQuery = cleanComp
    ? `"${cleanComp}" email format OR "email pattern" site:rocketreach.co OR site:hunter.io`
    : '';
  const emailPatternUrl = cleanComp
    ? `https://www.google.com/search?q=${encodeURIComponent(emailPatternQuery)}`
    : '';

  // Outreach Note Template
  const connectionNote = `Hi ${cleanHR},\n\nI noticed ${cleanComp || 'your company'} is actively hiring for ${cleanRole}. I specialize in placing pre-assessed talent and would love to connect to see if we can support your hiring pipeline.\n\nBest regards,\n${craName}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="bg-gray-950/90 border border-purple-900/40 rounded-xl p-4 my-2 text-xs text-gray-200 shadow-xl space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-900/60 rounded-lg text-purple-300 border border-purple-700/50">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">
              How to Find HR & Outreach Helper
            </span>
            {cleanComp ? (
              <span className="text-[11px] text-purple-300 ml-2 font-medium">
                for <strong className="text-white">{cleanComp}</strong>
              </span>
            ) : null}
          </div>
        </div>
        <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full font-semibold">
          HR Sourcing Toolkit
        </span>
      </div>

      {/* Warning if company name is missing or blank */}
      {!cleanComp ? (
        <div className="p-3 bg-amber-950/70 border border-amber-600/60 rounded-xl text-amber-200 text-xs flex items-center gap-2.5 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Add company name to generate search links</span>
        </div>
      ) : (
        /* Action Links & Search Buttons Grid (5 Targeted Queries) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Query a: LinkedIn People Search */}
          <a
            href={linkedinPeopleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-blue-700/60 transition group text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <UserCheck className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-white group-hover:text-blue-300 text-[11px]">
                  LinkedIn People Search
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {cleanComp} HR / Recruiter filter
                </div>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-400 shrink-0 ml-1.5" />
          </a>

          {/* Query b: Google X-Ray Search */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-700/60 transition">
            <div className="flex items-center gap-2 truncate mr-2">
              <Search className="h-4 w-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-white text-[11px]">Google X-Ray (Full)</div>
                <div className="text-[10px] text-gray-400 truncate font-mono">
                  site:linkedin.com/in "{cleanComp}"...
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(googleXRayQuery, 'xray')}
                className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                title="Copy Google X-Ray query"
              >
                {copiedKey === 'xray' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={googleXRayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md bg-purple-900/60 hover:bg-purple-800 text-purple-200 transition cursor-pointer"
                title="Open Google X-Ray search in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Query c: Short Name X-Ray Search (if cleaned name differs) */}
          {showShortName && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 border border-purple-800/50 hover:border-purple-600 transition">
              <div className="flex items-center gap-2 truncate mr-2">
                <Search className="h-4 w-4 text-pink-400 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-white text-[11px] flex items-center gap-1">
                    <span>Short Name Search</span>
                    <span className="text-[9px] bg-pink-950 text-pink-300 border border-pink-700/50 px-1 rounded">
                      {shortComp}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate font-mono">
                    site:linkedin.com/in "{shortComp}"...
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(shortXRayQuery, 'short-xray')}
                  className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                  title="Copy Short Name X-Ray query"
                >
                  {copiedKey === 'short-xray' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={shortXRayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md bg-pink-900/60 hover:bg-pink-800 text-pink-200 transition cursor-pointer"
                  title="Open Short Name X-Ray in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Query d: Careers & Contact Page Search */}
          <a
            href={careersSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-emerald-700/60 transition group text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-white group-hover:text-emerald-300 text-[11px]">
                  Careers & Contact Search
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  "{cleanComp}" careers contact HR email
                </div>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-gray-500 group-hover:text-emerald-400 shrink-0 ml-1.5" />
          </a>

          {/* Query e: Email Pattern Search */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-teal-700/60 transition">
            <div className="flex items-center gap-2 truncate mr-2">
              <AtSign className="h-4 w-4 text-teal-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-white text-[11px]">Email Pattern Search</div>
                <div className="text-[10px] text-gray-400 truncate font-mono">
                  "{cleanComp}" email format / RocketReach / Hunter
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(emailPatternQuery, 'email-pattern')}
                className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                title="Copy Email Pattern query string"
              >
                {copiedKey === 'email-pattern' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={emailPatternUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md bg-teal-900/60 hover:bg-teal-800 text-teal-200 transition cursor-pointer"
                title="Open Email Pattern search in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Two Columns: Checklist & Email Tip + Connection Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Short Checklist & Email Pattern Tip */}
        <div className="space-y-2.5 bg-gray-900/70 border border-gray-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
            <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
            <span>Short Recruiter Checklist:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300 pl-0.5 leading-normal">
            <li>Check the company's LinkedIn page &rarr; People &rarr; filter <strong className="text-white">"Human Resources"</strong>.</li>
            <li>Look for the recruiter who posted the job on LinkedIn / job portal.</li>
            <li>Check the job post description or header for direct contact email.</li>
            <li>Save the profile URL, verified email, and phone manually in this sheet.</li>
          </ol>

          <div className="pt-2 border-t border-gray-800/80 text-[11px] text-gray-300 flex items-start gap-2">
            <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-300">Email pattern tip:</span> Find one verified employee email format (e.g., <code className="text-purple-300 bg-gray-950 px-1 py-0.5 rounded">first.last@company.com</code> or <code className="text-purple-300 bg-gray-950 px-1 py-0.5 rounded">first@company.com</code>) and try the same for HR; verify before sending.
            </div>
          </div>
        </div>

        {/* Connection Note Template & 1-Click Copy */}
        <div className="space-y-2 bg-gray-900/70 border border-gray-800 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-purple-300 font-semibold text-[11px]">
                <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                LinkedIn Connection Note Template:
              </span>
              <button
                type="button"
                onClick={() => handleCopy(connectionNote, 'note')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-sm transition cursor-pointer"
              >
                {copiedKey === 'note' ? (
                  <>
                    <Check className="h-3 w-3 text-white" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-white" />
                    Copy Connection Note
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800/90 text-gray-300 text-[11px] whitespace-pre-line font-sans leading-relaxed select-all">
              {connectionNote}
            </div>
          </div>
          <div className="text-[10px] text-gray-400 italic">
            * Remember: No fake numbers. Phone must be entered manually once confirmed.
          </div>
        </div>
      </div>
    </div>
  );
};
