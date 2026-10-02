import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Find text in DocumentIntakeModal
const idx = code.indexOf('AI extraction encountered error, using rule-based parser');
if (idx !== -1) {
  console.log('DocumentIntake snippet around AI extract:');
  console.log(code.substring(idx - 600, idx + 1000));
}
