import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

const start = 654286;
// Find where it ends or print first 4000 characters
console.log('=== ar (TeamSheetsPage) snippet ===');
console.log(code.substring(start, start + 4000));
