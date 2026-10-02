import fs from 'fs';
const code = fs.readFileSync('/tmp/deployed.js', 'utf8');

let pos = 0;
while ((pos = code.indexOf('jd-list', pos)) !== -1) {
  console.log('Match at', pos, ':', code.slice(pos - 60, pos + 100));
  pos += 7;
}
