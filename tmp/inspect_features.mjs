import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Find proof related features
const proofMatches = code.match(/.{0,100}(proof_screenshot|uploadProof|ProofModal|proofModal|screenshot).{0,100}/gi) || [];
console.log('Proof matches count:', proofMatches.length);
console.log('Proof sample:', proofMatches.slice(0, 5));

// Find components in the bundle
const compMatches = code.match(/function [A-Z][a-zA-Z0-9]+\(/g) || [];
console.log('Top level component names (sample):', compMatches.slice(0, 30));

// Find sidebar navigation items:
const navDef = code.match(/\{id:\s*["'][a-z0-9\-_]+["'],\s*label:\s*["'][^"']+["'],\s*icon:\s*[a-zA-Z0-9]+\}/g);
console.log('All nav items:', navDef);
