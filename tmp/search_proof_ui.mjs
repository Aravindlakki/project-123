import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

let pos = 0;
let matchNum = 0;
while (true) {
  const found = code.indexOf('proof_screenshot', pos);
  if (found === -1) break;
  console.log(`=== proof_screenshot match ${matchNum++} at ${found} ===`);
  console.log(code.substring(Math.max(0, found - 200), found + 300));
  pos = found + 20;
}
