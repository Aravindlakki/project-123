import fs from 'fs';
const code = fs.readFileSync('/tmp/deployed.js', 'utf8');

// Check what routes or paths are used in deployed.js
const routes = code.match(/["'](\/(?:admin\/)?[a-z0-9_-]+)["']/g) || [];
console.log('Routes in deployed build:', [...new Set(routes)]);

// Check for any specific features or buttons
const buttons = [
  'Generate Outreach',
  'AI Outreach',
  'Draft Email',
  'Cold Outreach',
  'HR Sourcing',
  'ExcelWorksheetImport',
  'DocumentIntake'
];
for (const b of buttons) {
  console.log(`Contains button/label "${b}":`, code.includes(b));
}
