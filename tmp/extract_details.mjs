import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Find all occurrences of STORAGE_KEYS or similar constants
const storageKeysMatch = code.match(/\{[A-Z_]+:"placemein_[^"]+"[^}]*\}/g);
console.log('Storage keys:', storageKeysMatch);

// Find canonical roster or user lists
const rosterMatches = code.match(/v7_canonical_[^"]+/g);
console.log('Roster versions:', rosterMatches);

// Find users in bundle
const usersMatch = code.match(/\{id:"usr_[^}]+name:"[^"]+"[^}]+\}/g);
console.log('Users sample (up to 10):', usersMatch?.slice(0, 10));

// Find components / page titles
const titles = Array.from(new Set(code.match(/title:\s*["'][^"']+["']/g) || []));
console.log('Titles:', titles.slice(0, 20));

// Find routes in App.tsx: case '...':
const cases = Array.from(new Set(code.match(/case\s+['"][a-z0-9\-_]+['"]\s*:/g) || []));
console.log('App route cases:', cases);
