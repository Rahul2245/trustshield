const fs = require('fs');
const file = 'frontend/src/pages/ThreatDetailPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replacements to match admin-theme
content = content.replace(/bg-white/g, 'bg-surface');
content = content.replace(/text-gray-900/g, 'text-primary');
content = content.replace(/text-gray-700/g, 'text-primary/90');
content = content.replace(/text-gray-600/g, 'text-muted');
content = content.replace(/text-gray-500/g, 'text-muted');
content = content.replace(/text-gray-400/g, 'text-muted/80');
content = content.replace(/bg-gray-100/g, 'bg-primary/10');
content = content.replace(/bg-gray-50\/50/g, 'bg-primary/5');
content = content.replace(/bg-gray-50\/80/g, 'bg-primary/5');
content = content.replace(/bg-gray-50/g, 'bg-primary/5');
content = content.replace(/hover:bg-gray-50/g, 'hover:bg-primary/10');
content = content.replace(/border-gray-100/g, 'border-border');
content = content.replace(/border-gray-200/g, 'border-border');
content = content.replace(/divide-gray-100/g, 'divide-border');
content = content.replace(/divide-gray-200/g, 'divide-border');

// Fix AI Reasoning section specifically
content = content.replace(/text-indigo-900/g, 'text-indigo-400');
content = content.replace(/text-indigo-700/g, 'text-indigo-300');
content = content.replace(/text-indigo-800/g, 'text-indigo-200');
content = content.replace(/bg-indigo-50/g, 'bg-indigo-500/10');
content = content.replace(/border-indigo-100/g, 'border-indigo-500/20');
content = content.replace(/hover:bg-indigo-50/g, 'hover:bg-indigo-500/20');

// Fix text colors in the payload box
content = content.replace(/text-slate-300/g, 'text-slate-200'); // make payload text slightly brighter
content = content.replace(/text-slate-500/g, 'text-slate-400');

// Fix emerald/red/amber backgrounds for light mode to dark mode equivalent
content = content.replace(/bg-emerald-50 /g, 'bg-emerald-500/10 ');
content = content.replace(/bg-amber-50 /g, 'bg-amber-500/10 ');
content = content.replace(/bg-red-50 /g, 'bg-red-500/10 ');

content = content.replace(/border-emerald-100/g, 'border-emerald-500/20');
content = content.replace(/border-amber-100/g, 'border-amber-500/20');
content = content.replace(/border-red-100/g, 'border-red-500/20');

content = content.replace(/border-emerald-200/g, 'border-emerald-500/30');

// Fix risk background function
content = content.replace(/return "bg-red-50 border-red-100"/g, 'return "bg-red-500/10 border-red-500/20"');
content = content.replace(/return "bg-amber-50 border-amber-100"/g, 'return "bg-amber-500/10 border-amber-500/20"');
content = content.replace(/return "bg-emerald-50 border-emerald-100"/g, 'return "bg-emerald-500/10 border-emerald-500/20"');

fs.writeFileSync(file, content);
console.log('done');
