const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);

let pDiff = 0, bDiff = 0;
let inStr = false, strChar = '', escapeNext = false;
let inComment = false, inMLComment = false;
const lines = script.split('\n');

for(let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  let prev = '';
  for(let i = 0; i < line.length; i++) {
    const c = line[i];

    if (escapeNext) { escapeNext = false; prev = c; continue; }
    if (c === '\\' && inStr) { escapeNext = true; prev = c; continue; }

    if (!inStr && !inComment && !inMLComment && (c === '"' || c === "'")) {
      inStr = true; strChar = c; prev = c; continue;
    }
    if (inStr && c === strChar && prev !== '\\') {
      inStr = false; strChar = ''; prev = c; continue;
    }
    if (inStr) { prev = c; continue; }

    if (!inMLComment && c === '/' && prev === '/') { inComment = true; prev = c; continue; }
    if (inComment && c === '\n') { inComment = false; prev = c; continue; }
    if (!inMLComment && c === '*' && prev === '/') { inMLComment = true; prev = c; continue; }
    if (inMLComment && c === '/' && prev === '*') { inMLComment = false; prev = c; continue; }

    if (!inComment && !inMLComment) {
      if (c === '(') pDiff++;
      if (c === ')') { pDiff--; if (pDiff < 0) { console.log('Extra ) at line', lineIdx+1, ':', line.substring(0,80)); pDiff = 0; } }
      if (c === '{') bDiff++;
      if (c === '}') { bDiff--; if (bDiff < 0) { console.log('Extra } at line', lineIdx+1, ':', line.substring(0,80)); bDiff = 0; } }
    }
    prev = c;
  }
}

console.log('Final pDiff:', pDiff, ', bDiff:', bDiff);