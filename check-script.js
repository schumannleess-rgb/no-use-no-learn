const fs = require('fs');
const data = fs.readFileSync('index.html', 'utf8');
const scriptStart = data.indexOf('<script>') + 8;
const scriptEnd = data.indexOf('</script>');
const script = data.substring(scriptStart, scriptEnd);

// Check for unterminated template literals
let inTemplate = false;
let templateStart = -1;
for(let i = 0; i < script.length; i++) {
  if (script[i] === '`' && (i === 0 || script[i-1] !== '\\')) {
    if (!inTemplate) {
      inTemplate = true;
      templateStart = i;
    } else {
      inTemplate = false;
    }
  }
}
console.log('Unterminated template:', inTemplate, 'at', templateStart);

// Check for unterminated strings
let inString = false;
let stringChar = '';
let stringStart = -1;
let lines = script.split('\n');
for(let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  for(let i = 0; i < line.length; i++) {
    const c = line[i];
    if (!inString) {
      if (c === '"' || c === "'") {
        inString = true;
        stringChar = c;
        stringStart = lineIdx;
      }
    } else {
      if (c === stringChar && line[i-1] !== '\\') {
        inString = false;
      }
    }
  }
}
if (inString) {
  console.log('Unterminated string at line', stringStart + 1);
  console.log('Line:', lines[stringStart]);
}

// Check for single-line comments that might affect parsing
// Look for </script inside string literals
let foundScriptInString = false;
let inStr = false;
let strChar = '';
for(let i = 0; i < script.length; i++) {
  const c = script[i];
  if (!inStr) {
    if (c === '"' || c === "'") {
      inStr = true;
      strChar = c;
    }
  } else {
    if (c === strChar && script[i-1] !== '\\') {
      inStr = false;
    }
  }
}
console.log('Found </script in string:', foundScriptInString);

// Look for unterminated regex
// Look for /* without */
// Look for unclosed braces in template strings
console.log('Script length:', script.length);
console.log('Line count:', lines.length);