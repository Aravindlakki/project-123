const fs = require("fs");
const code = fs.readFileSync("/tmp/vercel-index.js", "utf8");

console.log("File size:", code.length);

// Look for ROSTER_VERSION, WORKSHEET_VERSION
const versionMatches = code.match(/[A-Z_]+_VERSION["']?\s*:\s*["'][^"']+["']/g);
console.log("Version matches:", versionMatches);

// Search for any git commit or repo url or keywords
const gitMatches = code.match(/https?:\/\/[^\s"']+/g) || [];
console.log("URLs found:", Array.from(new Set(gitMatches)).filter(u => !u.includes("w3.org") && !u.includes("googleapis.com")));

// Look for tab names / navigation items
const navMatches = code.match(/label:\s*["'][^"']+["']/g) || [];
console.log("Nav labels:", Array.from(new Set(navMatches)));

// Look for headings in getTabHeading or headingsMap
const headings = code.match(/(Team Worksheets|My Worksheet|Worksheet|Dashboard|CRA|Sourcing|Outreach)/gi) || [];
console.log("Headings counts:", {
  "Team Worksheets": (code.match(/Team Worksheets/g) || []).length,
  "My Worksheet": (code.match(/My Worksheet/g) || []).length,
  "My Outreach Pipeline": (code.match(/My Outreach Pipeline/g) || []).length,
  "proof": (code.match(/proof/gi) || []).length,
  "response_status": (code.match(/response_status/g) || []).length,
});
