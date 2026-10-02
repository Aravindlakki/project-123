import fs from 'fs';
const code = fs.readFileSync('/tmp/deployed.js', 'utf8');

// Search for snippets in deployed.js related to DashboardPage
const dashboardIdx = code.indexOf('Attendance of Team');
console.log('Attendance snippet:', dashboardIdx >= 0 ? code.slice(dashboardIdx - 200, dashboardIdx + 500) : 'Not found');

const worksheetIdx = code.indexOf('Team Worksheet & HR Sourcing');
console.log('Worksheet snippet:', worksheetIdx >= 0 ? code.slice(worksheetIdx - 200, worksheetIdx + 500) : 'Not found');
