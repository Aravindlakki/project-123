import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Find `const api = {` or similar
// In the bundle, api methods are called like W.methodName or similar object
// Let's find uploadWorksheetProofScreenshot and see the object it belongs to
const idx = code.indexOf('uploadWorksheetProofScreenshot(');
if (idx !== -1) {
  // Let's print 2000 chars before and 2000 chars after
  console.log(code.substring(idx - 1500, idx + 2000));
}
