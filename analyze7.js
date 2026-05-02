const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);

// Binary search more precisely
let low = 0, high = script.length;
for(let iter = 0; iter < 20; iter++) {
  const mid = Math.floor((low + high) / 2);
  try {
    new Function(script.slice(0, mid));
    low = mid;
  } catch(e) {
    high = mid;
  }
}

// Now low and high are very close - find the exact failure point
for(let i = Math.max(0, low-20); i < Math.min(script.length, low+20); i++) {
  try {
    new Function(script.slice(0, i));
  } catch(e) {
    console.log('First failure at position', i, ':', e.message);
    console.log('Char at', i, ':', JSON.stringify(script[i]), 'code:', script.charCodeAt(i));
    console.log('Context:', JSON.stringify(script.slice(Math.max(0,i-30), i+30)));
    break;
  }
}