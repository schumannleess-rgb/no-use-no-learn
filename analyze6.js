const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);

const halfLen = Math.floor(script.length / 2);
const firstHalf = script.slice(0, halfLen);
const secondHalf = script.slice(halfLen);

try {
  new Function(firstHalf);
  console.log('First half parses: OK (length', firstHalf.length, ')');
} catch(e) {
  console.log('First half parse error:', e.message, '(length', firstHalf.length, ')');
}

try {
  new Function(secondHalf);
  console.log('Second half parses: OK (length', secondHalf.length, ')');
} catch(e) {
  console.log('Second half parse error:', e.message, '(length', secondHalf.length, ')');
}

// Binary search to find exact error position
let low = 0, high = script.length;
while (high - low > 100) {
  const mid = Math.floor((low + high) / 2);
  try {
    new Function(script.slice(0, mid));
    low = mid;
  } catch(e) {
    high = mid;
  }
}
console.log('\nError starts somewhere in bytes', low, 'to', high);
const suspect = script.slice(low, low+200);
console.log('Around byte', low, ':', JSON.stringify(suspect.substring(0, 100)));