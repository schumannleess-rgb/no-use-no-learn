const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const idx = html.indexOf('id="key-save-btn"');
const after = html.substring(idx);
const onclickStart = after.indexOf('onclick="');
const onclickContent = after.substring(onclickStart + 8, after.indexOf('"', onclickStart + 8));

console.log('onclick content length:', onclickContent.length);
console.log('Contains </script:', onclickContent.includes('</script'));
console.log('Last 50 chars:', onclickContent.substring(onclickContent.length - 50));

// Check character codes in last 50
for (let i = onclickContent.length - 20; i < onclickContent.length; i++) {
  console.log('  char', i, ':', onclickContent[i], 'code:', onclickContent.charCodeAt(i));
}