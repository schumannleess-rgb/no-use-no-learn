const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);

console.log('Script last 100 chars:');
console.log(script.slice(-100).toString('utf8').replace(/\n/g, '\\n'));
console.log('\nScript last 10 char codes:');
for(let i = script.length - 10; i < script.length; i++) {
  console.log('  char', i, ':', script[i], '(code', script.charCodeAt(i), ')');
}

// Try parsing just the last 50 chars
const last50 = script.slice(-50);
try {
  new Function('function test(){' + last50 + '}');
  console.log('Last 50 parses: OK');
} catch(e) {
  console.log('Last 50 parse error:', e.message);
}

// Try parsing last 100
const last100 = script.slice(-100);
try {
  new Function('function test(){' + last100 + '}');
  console.log('Last 100 parses: OK');
} catch(e) {
  console.log('Last 100 parse error:', e.message);
}

// Check: is the script cut off inside a template literal?
const lastBacktick = script.lastIndexOf('`');
const lastNewline = script.lastIndexOf('\n');
console.log('\nLast backtick at:', lastBacktick, 'from end, last newline at:', lastNewline, 'from end');