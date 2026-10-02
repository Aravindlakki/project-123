import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

const idx = code.indexOf('uploadWorksheetProofScreenshot');
if (idx !== -1) {
  console.log('=== uploadWorksheetProofScreenshot ===');
  console.log(code.substring(idx - 100, idx + 1500));
}

// Also let's check where uploadWorksheetProofScreenshot is used in the UI
const usages = [];
let pos = 0;
while (true) {
  const found = code.indexOf('uploadWorksheetProofScreenshot', pos);
  if (found === -1) break;
  usages.push(found);
  pos = found + 30;
}
console.log('Found occurrences:', usages.length);
usages.forEach((p, i) => {
  console.log(`=== Occurrence ${i} ===`);
  console.log(code.substring(Math.max(0, p - 200), p + 500));
});
