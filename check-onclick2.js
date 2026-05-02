const fs = require('fs');
const data = fs.readFileSync('index.html', 'utf8');
const idx = data.indexOf('id="key-save-btn"');
let pos = idx + 16;
let inQuote = false;
let quoteChar = '';
let endPos = -1;
for(let i = pos; i < data.length; i++) {
  const c = data[i];
  if (!inQuote) {
    if (c === '"' || c === "'") {
      inQuote = true;
      quoteChar = c;
    }
  } else {
    if (c === quoteChar && data[i-1] !== '\\') {
      inQuote = false;
      endPos = i;
      break;
    }
  }
}
if (endPos === -1) { console.log('Could not find end'); process.exit(1); }
const onclick = data.substring(pos, endPos);
console.log('onclick length:', onclick.length);
console.log('First 50:', onclick.substring(0, 50));
console.log('Last 50:', onclick.substring(onclick.length - 50));
console.log('Contains </:', onclick.includes('</'));
// Count backslashes
const backslashCount = (onclick.match(/\\/g) || []).length;
console.log('Backslash count:', backslashCount);