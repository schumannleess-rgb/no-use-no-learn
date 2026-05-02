const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);

// Count parens
let openParens = 0, closeParens = 0;
let openBraces = 0, closeBraces = 0;
let openBrackets = 0, closeBrackets = 0;
let inStr = false;
let strChar = '';
let escapeNext = false;
let inComment = false;
let inMLComment = false;

for(let i = 0; i < script.length; i++) {
  const c = script[i];
  const prev = i > 0 ? script[i-1] : '';

  if (escapeNext) {
    escapeNext = false;
    continue;
  }

  if (c === '\\' && inStr) {
    escapeNext = true;
    continue;
  }

  if (!inStr && !inComment && !inMLComment && (c === '"' || c === "'")) {
    inStr = true;
    strChar = c;
    continue;
  }

  if (inStr && c === strChar) {
    inStr = false;
    continue;
  }

  if (!inStr) {
    // Single line comment
    if (!inMLComment && c === '/' && prev === '/') {
      inComment = true;
      continue;
    }
    if (inComment && c === '\n') {
      inComment = false;
      continue;
    }

    // Multi-line comment
    if (!inMLComment && c === '*' && prev === '/') {
      inMLComment = true;
      continue;
    }
    if (inMLComment && c === '/' && prev === '*') {
      inMLComment = false;
      continue;
    }

    if (!inComment && !inMLComment) {
      if (c === '(') openParens++;
      if (c === ')') closeParens++;
      if (c === '{') openBraces++;
      if (c === '}') closeBraces++;
      if (c === '[') openBrackets++;
      if (c === ']') closeBrackets++;
    }
  }
}

console.log('Parens: ( =', openParens, ', ) =', closeParens, ', diff =', openParens - closeParens);
console.log('Braces: { =', openBraces, ', } =', closeBraces, ', diff =', openBraces - closeBraces);
console.log('Brackets: [ =', openBrackets, ', ] =', closeBrackets, ', diff =', openBrackets - closeBrackets);

// Now scan for specific issues
console.log('\nSearching for issues...');

// Look for function() without closing parens
// Look for regex patterns that might be confused
// Check for arrow functions with block vs expression bodies