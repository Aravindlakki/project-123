import React from 'react';
import { Download, Printer, X, FileText, CheckCircle2, ShieldCheck, ExternalLink, Sparkles, Layers, Building2, Send, Award, Users, RefreshCw } from 'lucide-react';

interface SystemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemReportModal: React.FC<SystemReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div 
        id="placemein-report-document"
        className="bg-gray-950 text-gray-100 border border-gray-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black print:rounded-none"
      >
        {/* Top Control Bar (Hidden during printing) */}
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                PLACEMEIN End-to-End System Report & Blueprint
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Ready for PDF
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Click <b>Save / Print as PDF</b> to download this complete architectural report as a PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              id="btn-print-pdf-report"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-900/40 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Save / Print as PDF</span>
            </button>
            <button
              onClick={onClose}
              id="btn-close-pdf-modal"
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl border border-gray-700 transition cursor-pointer"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document Body (Optimized for Screen and Print) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 print:p-8 print:overflow-visible print:text-black">
          
          {/* Cover / Header Section */}
          <div className="border-b border-gray-800 pb-6 print:border-gray-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-2xl shadow-md border border-purple-200">
                  <img src="/placemein-logo.png" alt="PLACEMEIN" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white print:text-black">PLACEMEIN</h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400 print:text-purple-700">
                    Recruitment Automation & Candidate Relationship Associate (CRA) CRM
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right text-xs text-gray-400 print:text-gray-600 space-y-1">
                <p><b>Report Type:</b> Complete System & Process Documentation</p>
                <p><b>Generated:</b> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><b>Version:</b> 1.0.0 Production Blueprint</p>
              </div>
            </div>
          </div>

          {/* 1. Executive Summary */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-purple-300 print:text-purple-900 flex items-center gap-2 border-b border-gray-800 print:border-gray-300 pb-2">
              <span>1. Executive Summary</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 print:text-gray-800 leading-relaxed">
              <b>PLACEMEIN</b> is an enterprise-grade recruitment operations and CRA candidate relationship management platform.
              It serves as the central operating system for frontline sourcing associates (CRAs) and leadership executives (CEO, Directors, Team Leads).
              The system standardizes hiring pipeline intake, multi-channel candidate/client touchpoints (Calls, Emails, LinkedIn, WhatsApp),
              daily attendance validation, priority Kanban tasks, and performance scorecards into a cohesive, resilient software architecture.
            </p>
          </section>

          {/* 2. End-to-End System Topology & How Parts Connect */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-purple-300 print:text-purple-900 flex items-center gap-2 border-b border-gray-800 print:border-gray-300 pb-2">
              <span>2. System Architecture & Interconnections</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 print:text-gray-800">
              The platform is structured into four tightly-integrated tiers designed for zero-latency execution and high fault tolerance:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 print:bg-gray-100 print:border-gray-300 space-y-2">
                <h3 className="text-sm font-black text-white print:text-black flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-500/20 text-purple-300">A</span>
                  Presentation & Session Tier
                </h3>
                <ul className="text-xs text-gray-300 print:text-gray-700 space-y-1.5 list-disc list-inside">
                  <li><b>Role-Driven UI:</b> Dynamically renders CRA Specialist workbench or Executive Admin view based on user authentication.</li>
                  <li><b>Quick-Profile Switcher:</b> Direct login for all 7 specialist CRA profiles with default credentials.</li>
                  <li><b>Admin Gate:</b> Password-protected access for CEO & Executive leadership.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 print:bg-gray-100 print:border-gray-300 space-y-2">
                <h3 className="text-sm font-black text-white print:text-black flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-500/20 text-purple-300">B</span>
                  Central API Client & Routing
                </h3>
                <ul className="text-xs text-gray-300 print:text-gray-700 space-y-1.5 list-disc list-inside">
                  <li><b>Unified Service Layer (<code className="text-purple-300 print:text-purple-700 font-mono">api.ts</code>):</b> Standardizes all data fetching and mutation methods.</li>
                  <li><b>Bearer Token Header:</b> Automatically injects tokens into authenticated endpoints.</li>
                  <li><b>Automatic Failover:</b> Detects unreachable backend endpoints and silently fails over to client persistence without user interruption.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 print:bg-gray-100 print:border-gray-300 space-y-2">
                <h3 className="text-sm font-black text-white print:text-black flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-500/20 text-purple-300">C</span>
                  Full-Stack Backend Server
                </h3>
                <ul className="text-xs text-gray-300 print:text-gray-700 space-y-1.5 list-disc list-inside">
                  <li><b>Express Ingress (<code className="text-purple-300 print:text-purple-700 font-mono">server.ts</code>):</b> Serves built Vite assets and mounts REST APIs on <code className="font-mono">/api/v1</code>.</li>
                  <li><b>Role Verification Middleware:</b> Guards sensitive executive routes (e.g. system settings, user targets).</li>
                  <li><b>Port 3000 Ingress:</b> Meets container deployment specifications for Google Cloud Run and Docker.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 print:bg-gray-100 print:border-gray-300 space-y-2">
                <h3 className="text-sm font-black text-white print:text-black flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-500/20 text-purple-300">D</span>
                  Resilient Client Store
                </h3>
                <ul className="text-xs text-gray-300 print:text-gray-700 space-y-1.5 list-disc list-inside">
                  <li><b>Fallback Engine (<code className="text-purple-300 print:text-purple-700 font-mono">clientFallbackStore.ts</code>):</b> Local storage engine with realistic seed data.</li>
                  <li><b>Vercel / GitHub Pages Support:</b> Allows the full application to run in static environments without breaking login or state.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Detailed Step-by-Step Operational Lifecycle */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-purple-300 print:text-purple-900 flex items-center gap-2 border-b border-gray-800 print:border-gray-300 pb-2">
              <span>3. End-to-End Operational Lifecycle</span>
            </h2>

            <div className="space-y-3 text-xs sm:text-sm text-gray-300 print:text-gray-800">
              <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 print:bg-gray-50 print:border-gray-300">
                <h4 className="font-bold text-white print:text-black mb-1">Step 1: Daily Login & Shift Attendance</h4>
                <p className="text-gray-400 print:text-gray-700 text-xs">
                  A CRA employee logs in using their assigned profile. The system initializes their daily session, displaying their check-in timestamp.
                  The user can punch in/out, log shift mode (Office, Remote, Field), or submit leave requests (Casual, Sick, Emergency) for managerial review.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 print:bg-gray-50 print:border-gray-300">
                <h4 className="font-bold text-white print:text-black mb-1">Step 2: Account Sourcing & Decision-Maker Registration</h4>
                <p className="text-gray-400 print:text-gray-700 text-xs">
                  In <b>HR Sourcing</b>, the CRA registers prospective employer companies (industry, headcount, location) and adds HR decision-makers
                  (Talent Acquisition Specialists, HRBPs, VP of HR). Contacts can also be bulk-imported via CSV or Excel spreadsheets using the batch parser.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 print:bg-gray-50 print:border-gray-300">
                <h4 className="font-bold text-white print:text-black mb-1">Step 3: Job Description (JD) Intake & Requirement Mapping</h4>
                <p className="text-gray-400 print:text-gray-700 text-xs">
                  Open mandates are submitted under <b>JD Intake</b> either via direct form input, URL ingestion, or PDF document parsing.
                  Each JD links to an existing company profile, tagging requirements (skills, budget, experience level) and directly contributing to the CRA's monthly target count.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 print:bg-gray-50 print:border-gray-300">
                <h4 className="font-bold text-white print:text-black mb-1">Step 4: Multi-Channel Outreach & Proof Logging</h4>
                <p className="text-gray-400 print:text-gray-700 text-xs">
                  Using the <b>Outreach Tracker</b>, CRAs execute and log touchpoints across Phone Calls (with durations), Emails, LinkedIn messages, and WhatsApp chats.
                  Touches are tagged with outcomes (Interested, Call Scheduled, Applied, No Response) and verified with proof-of-work screenshot attachments.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 print:bg-gray-50 print:border-gray-300">
                <h4 className="font-bold text-white print:text-black mb-1">Step 5: Team Worksheets & Real-Time Sync</h4>
                <p className="text-gray-400 print:text-gray-700 text-xs">
                  Under <b>Team Worksheets</b>, every logged contact, remark, and status update flows into an interactive tabular view.
                  CRAs can toggle between their personal dedicated sheet or the master view, make inline remark edits, and export data as CSV or printable PDF.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 print:bg-gray-50 print:border-gray-300">
                <h4 className="font-bold text-white print:text-black mb-1">Step 6: Executive Oversight & League Performance</h4>
                <p className="text-gray-400 print:text-gray-700 text-xs">
                  The Leadership Admin Portal calculates live performance metrics across all specialists: Target vs. Actual JDs, Positive Response Rates,
                  and Channel Distribution. Executive leadership uses this dashboard to set quotas, manage employee profiles, and balance recruitment workloads.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Pre-Configured Team Accounts */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-purple-300 print:text-purple-900 flex items-center gap-2 border-b border-gray-800 print:border-gray-300 pb-2">
              <span>4. Provisioned System Accounts & Targets</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 print:border-gray-400 text-gray-400 print:text-gray-600">
                    <th className="py-2 px-3">Employee ID</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Email Address</th>
                    <th className="py-2 px-3">Specialization & Domain</th>
                    <th className="py-2 px-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 print:divide-gray-200 text-gray-300 print:text-gray-800">
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-101</td>
                    <td className="py-2 px-3 font-bold">Harish Reddy</td>
                    <td className="py-2 px-3">harish.r@placemein.com</td>
                    <td className="py-2 px-3">Cloud & Cyber Security Tech</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-102</td>
                    <td className="py-2 px-3 font-bold">Namitha K</td>
                    <td className="py-2 px-3">namitha.k@placemein.com</td>
                    <td className="py-2 px-3">Cyber Security & Enterprise Outbound</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-103</td>
                    <td className="py-2 px-3 font-bold">Charan Kumar</td>
                    <td className="py-2 px-3">charankumar.n@placemein.com</td>
                    <td className="py-2 px-3">Full-Stack Engineering & DevSecOps</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-104</td>
                    <td className="py-2 px-3 font-bold">Aliya Shaik</td>
                    <td className="py-2 px-3">aliya.s@placemein.com</td>
                    <td className="py-2 px-3">AI/ML Engineering & Data Platforms</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-105</td>
                    <td className="py-2 px-3 font-bold">Solomon Raj</td>
                    <td className="py-2 px-3">solomon.r@placemein.com</td>
                    <td className="py-2 px-3">Product, Design & Mobile Engineering</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-106</td>
                    <td className="py-2 px-3 font-bold">Varshith Reddy</td>
                    <td className="py-2 px-3">varshith.r@placemein.com</td>
                    <td className="py-2 px-3">SRE, DevOps & Infrastructure</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-purple-300 print:text-purple-700">PM-107</td>
                    <td className="py-2 px-3 font-bold">Aasritha K</td>
                    <td className="py-2 px-3">aasritha.k@placemein.com</td>
                    <td className="py-2 px-3">Leadership, Exec Search & Corporate Tech</td>
                    <td className="py-2 px-3">CRA Specialist</td>
                  </tr>
                  <tr className="bg-amber-950/20 print:bg-amber-50 font-bold">
                    <td className="py-2 px-3 font-mono text-amber-300 print:text-amber-800">PM-CEO</td>
                    <td className="py-2 px-3">Aravind Reddy</td>
                    <td className="py-2 px-3">aravindaravind3953@gmail.com</td>
                    <td className="py-2 px-3">Executive Leadership & Strategic Operations</td>
                    <td className="py-2 px-3 text-amber-400 print:text-amber-700">CEO / Super Admin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Document Footer */}
          <div className="pt-6 border-t border-gray-800 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 print:text-gray-600 gap-2">
            <span>PLACEMEIN Recruitment Automation CRM · Confidential Internal Operational Report</span>
            <span>Generated from Active System Architecture & Data Model</span>
          </div>

        </div>
      </div>
    </div>
  );
};
