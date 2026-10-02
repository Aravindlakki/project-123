import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Let's check employeeCredentials in vercel bundle
const credStart = code.indexOf('PM-CEO');
if (credStart !== -1) {
  console.log('Credentials snippet:');
  console.log(code.substring(credStart - 100, credStart + 1500));
}

// Let's check clientFallbackStore in vercel bundle
const storeStart = code.indexOf('placemein_roster_version_v6');
if (storeStart !== -1) {
  console.log('Store snippet:');
  console.log(code.substring(storeStart - 100, storeStart + 2500));
}
