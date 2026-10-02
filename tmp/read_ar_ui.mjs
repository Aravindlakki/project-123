import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

const start = 654286;
// Search for JSX elements in ar
const sub = code.substring(start, start + 30000);
// Let's find headings, buttons, tabs, modal titles inside this component
const matches = sub.match(/children:\[?["'][^"']{3,80}["']/g) || [];
console.log('Text elements inside ar:');
console.log(Array.from(new Set(matches)).slice(0, 40));
