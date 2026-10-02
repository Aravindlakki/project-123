import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

const urls = Array.from(new Set(code.match(/https?:\/\/[^\s"'\`\\]+/g) || []))
  .filter(u => !u.includes('w3.org') && !u.includes('googleapis.com') && !u.includes('gstatic.com'));
console.log('URLs:', urls);

const git = code.match(/github\.com\/[a-zA-Z0-9_\-\.\/]+/g);
console.log('GitHub references:', git);

const labels = Array.from(new Set(code.match(/label:\s*["'][^"']+["']/g) || []));
console.log('Nav labels:', labels);

const teamSheetsMentions = code.match(/.{0,80}(Team Worksheets|My Worksheet|Worksheet|outreach|pipeline).{0,80}/gi) || [];
console.log('Worksheet mentions:', teamSheetsMentions.slice(0, 10));
