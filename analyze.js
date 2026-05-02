const fs = require('fs');
const data = fs.readFileSync('index.html');
const idx = data.indexOf(Buffer.from('id="key-save-btn"'));
const after = data.slice(idx);
let end = -1;
for(let i = 0; i < after.length; i++) {
  if (after[i] === 62) { // >
    end = i;
    break;
  }
}
const chunk = after.slice(0, end+1).toString('utf8');
const m = chunk.match(/onclick="([^"]+)"/);
if (!m) { console.log('onclick not found'); process.exit(1); }
const val = m[1];
console.log('onclick value length:', val.length);
console.log('Backslash count:', (val.match(/\\/g) || []).length);
console.log('Double quote count:', (val.match(/"/g) || []).length);
console.log('Single quote count:', (val.match(/'/g) || []).length);
console.log('Contains </:', val.includes('</'));
console.log('Last 50 chars:', JSON.stringify(val.slice(-50)));

// Check for CRLF issue
const hasCRLF = val.includes('\r\n') || val.includes('\r');
console.log('Has CRLF:', hasCRLF);

// Check if the entire script parses
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);
try {
  new Function(script);
  console.log('Script parses: OK');
} catch(e) {
  console.log('Script parse error:', e.message);
  const errLine = e.message.match(/line (\d+)/);
  if (errLine) {
    const lineNum = parseInt(errLine[1]);
    const lines = script.split('\n');
    console.log('Error at line', lineNum, ':', lines[lineNum-1]);
    console.log('Previous line:', lines[lineNum-2]);
  }
}