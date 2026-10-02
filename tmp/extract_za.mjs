import fs from 'fs';
const code = fs.readFileSync('/tmp/deployed.js', 'utf8');

// Find definition of Za
const match = code.match(/function Za\([^)]*\)\{[^}]+\}/) || code.match(/const Za=[^;]+;/);
if (match) {
  console.log('Found Za definition:', match[0].slice(0, 500));
} else {
  // Let's find where Za is defined before line 745410
  const sliceBefore = code.slice(740000, 745420);
  const zaDef = sliceBefore.match(/(?:const|function)\s+Za\b[\s\S]{1,500}/);
  console.log('zaDef near main:', zaDef ? zaDef[0].slice(0, 500) : 'not found');
}
