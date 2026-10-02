import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

const start = 654286;
// Find next component boundary after ar.
// Usually marked by `,something=({ or ,something=function or export
const nextCompIdx = code.indexOf(',ka=', start);
console.log('ar length:', nextCompIdx !== -1 ? nextCompIdx - start : 'unknown');

const arCode = code.substring(start, nextCompIdx !== -1 ? nextCompIdx : start + 40000);
fs.writeFileSync('/tmp/extracted_ar.js', arCode);
console.log('Saved /tmp/extracted_ar.js of length', arCode.length);
