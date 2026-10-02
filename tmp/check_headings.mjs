import fs from 'fs';
const code = fs.readFileSync('/tmp/deployed.js', 'utf8');

const regex = /"([^"]{4,50})"/g;
let m;
const headings = new Set();
while ((m = regex.exec(code)) !== null) {
  const val = m[1];
  if (
    val.includes('Dashboard') ||
    val.includes('Outreach') ||
    val.includes('Worksheet') ||
    val.includes('Portal') ||
    val.includes('Sourcing') ||
    val.includes('Intake') ||
    val.includes('Attendance') ||
    val.includes('Performance') ||
    val.includes('Task') ||
    val.includes('CRM')
  ) {
    headings.add(val);
  }
}
console.log('Headings in deployed build:', Array.from(headings));
