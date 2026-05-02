const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);

try {
  new Function(script);
  console.log('Script parses: OK');
} catch(e) {
  console.log('Error message:', e.message);
  // Parse the error to find the position
  const posMatch = e.message.match(/position (\d+)/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]);
    const before = script.slice(Math.max(0, pos-50), pos);
    const after_pos = script.slice(pos, pos+20);
    console.log('Context around position', pos, ':');
    console.log('Before:', JSON.stringify(before));
    console.log('After:', JSON.stringify(after_pos));
    console.log('Char at pos:', script[pos], '(code', script.charCodeAt(pos), ')');
    console.log('Char at pos-1:', script[pos-1], '(code', script.charCodeAt(pos-1), ')');
  }
  const lineMatch = e.message.match(/line (\d+)/);
  if (lineMatch) {
    const lineNum = parseInt(lineMatch[1]);
    const lines = script.split('\n');
    console.log('Error at line', lineNum, ':', JSON.stringify(lines[lineNum-1]));
    console.log('Line', lineNum-1, ':', JSON.stringify(lines[lineNum-2]));
  }
}