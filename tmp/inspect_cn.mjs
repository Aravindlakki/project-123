import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

const start = 178573;
// Find where Cn ends by searching for next top-level component or inspecting next 15000 chars
const sub = code.substring(start, start + 18000);
const textMatches = sub.match(/children:\[?["'][^"']{3,100}["']/g) || [];
console.log('Text matches inside Cn:');
console.log(Array.from(new Set(textMatches)).slice(0, 50));

// Also let's check for any onClick or buttons or navigation targets in Cn
const tabClicks = sub.match(/t\(["'][a-z0-9_-]+["']\)/g) || [];
console.log('Tab clicks in Cn:', Array.from(new Set(tabClicks)));
