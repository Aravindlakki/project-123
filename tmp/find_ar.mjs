import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Find where `function ar(` or `const ar=` is defined
// In React bundled code, look for ar= or function ar
const matches = [];
let idx = 0;
while (true) {
  const found = code.indexOf('function ar(', idx);
  if (found === -1) break;
  matches.push({ type: 'function', pos: found });
  idx = found + 12;
}
let idx2 = 0;
while (true) {
  const found = code.indexOf('const ar=', idx2);
  if (found === -1) break;
  matches.push({ type: 'const', pos: found });
  idx2 = found + 9;
}

console.log('Matches for ar:', matches);
matches.forEach((m, i) => {
  console.log(`=== Match ${i} ===`);
  console.log(code.substring(m.pos, m.pos + 1200));
});
