import fs from 'fs';

const code = fs.readFileSync('/tmp/vercel-index.js', 'utf8');

// Let's find all tabs rendered in the main content of App
// In the previous output we saw:
// u==="jd-intake"&&e.jsx(Tn,{}),u==="jd-list"&&e.jsx(Za,{currentUser:a})...
const tabRenderIdx = code.indexOf('u==="dashboard"');
if (tabRenderIdx !== -1) {
  console.log('App render tabs:');
  console.log(code.substring(tabRenderIdx, tabRenderIdx + 1500));
} else {
  // search for "dashboard"
  const m = code.match(/u==="[a-z0-9_-]+"[^,;]+/g);
  console.log('Matches for tab conditions:', m);
}
