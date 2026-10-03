export interface PDFLeadRecord {
  id: string;
  company_name: string;
  website?: string;
  linkedin_url?: string;
  employee_count?: string;
  industry?: string;
  hr_name: string;
  title: string;
  phone?: string;
  email?: string;
  hr_linkedin?: string;
  domain: string;
  location: string;
  remarks: string;
  spoc: string; // Sheet owner: 'Namitha' | 'Aravind' | 'Mansi' | 'Vineela' | 'Harish' | 'Solomon' | 'Charan' | 'Mrudula'
  entered_by_name: string;
  proof_screenshot_url?: string;
  proof_screenshot_uploaded_at?: string;
}

export const INITIAL_PDF_LEADS: PDFLeadRecord[] = [];

export const SPOC_MEMBERS = [
  { id: 'Aravind', name: 'Aravind Reddy', role: 'CRA Specialist (Admin & Emp Access)', email: 'aravindreddy.l@placemein.com', avatarBg: 'bg-amber-600' },
  { id: 'Mansi', name: 'Mansi Ramesh Peddi', role: 'CRA Team Lead & Verification Head (Admin)', email: 'mansi.p@placemein.com', avatarBg: 'bg-purple-700' },
  { id: 'Vineela', name: 'Vineela Bathula', role: 'Manager & Talent Partner (Admin)', email: 'vineela.b@placemein.com', avatarBg: 'bg-indigo-700' },
  { id: 'Harish', name: 'Harish Reddy', role: 'CRA Specialist', email: 'harish.r@placemein.com', avatarBg: 'bg-purple-600' },
  { id: 'Solomon', name: 'Solomon Raj', role: 'CRA Specialist', email: 'solomon.r@placemein.com', avatarBg: 'bg-blue-600' },
  { id: 'Charan', name: 'Charan Kumar', role: 'CRA Specialist', email: 'charankumar.n@placemein.com', avatarBg: 'bg-teal-600' },
  { id: 'Mrudula', name: 'Mrudula', role: 'CRA Specialist', email: 'mrudula.k@placemein.com', avatarBg: 'bg-pink-600' },
  { id: 'Namitha', name: 'Namitha K', role: 'CRA Specialist', email: 'namitha.k@placemein.com', avatarBg: 'bg-emerald-600' },
];

export function getDynamicSpocMembers(): Array<{ id: string; name: string; role: string; email: string; avatarBg: string }> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('placemein_mock_users') : null;
    if (raw) {
      const users: any[] = JSON.parse(raw);
      if (Array.isArray(users) && users.length > 0) {
        const seen = new Set<string>();
        const list: Array<{ id: string; name: string; role: string; email: string; avatarBg: string }> = [];

        for (const m of SPOC_MEMBERS) {
          seen.add(m.name.toLowerCase());
          list.push(m);
        }

        const colors = ['bg-teal-600', 'bg-cyan-600', 'bg-rose-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600'];
        users.forEach((u, i) => {
          if (u.name && !seen.has(u.name.toLowerCase())) {
            seen.add(u.name.toLowerCase());
            list.push({
              id: u.name.split(' ')[0],
              name: u.name,
              role: u.designation || (u.role === 'admin' ? 'Admin' : 'CRA Specialist'),
              email: u.email || '',
              avatarBg: colors[i % colors.length],
            });
          }
        });

        // Also ensure current logged in employee is present
        try {
          const curRaw = localStorage.getItem('placemein_current_user');
          if (curRaw) {
            const cur = JSON.parse(curRaw);
            if (cur?.name && !seen.has(cur.name.toLowerCase())) {
              seen.add(cur.name.toLowerCase());
              list.push({
                id: cur.name.split(' ')[0],
                name: cur.name,
                role: cur.designation || (cur.role === 'admin' ? 'Admin' : 'CRA Specialist'),
                email: cur.email || '',
                avatarBg: 'bg-emerald-600',
              });
            }
          }
        } catch (_) {}

        return list;
      }
    }
  } catch (_) {}
  return SPOC_MEMBERS;
}
