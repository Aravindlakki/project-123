import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Let's check proof screenshot viewing / upload in TeamSheetsPage in vercel bundle
const start = 654286;
const sub = code.substring(start, start + 35000);

// Search for uploadWorksheetProofScreenshot or file input in ar
const proofUploadMatches = sub.match(/.{0,100}(uploadWorksheetProofScreenshot|proof_screenshot|ProofModal|proofModal).{0,100}/g) || [];
console.log('Proof upload matches in ar:', proofUploadMatches);

// Search for modal states in ar
const modals = sub.match(/isOpen:\s*[a-zA-Z0-9_]+/g) || [];
console.log('Modals in ar:', modals);
