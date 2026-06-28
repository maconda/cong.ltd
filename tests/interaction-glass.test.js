const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const css = readFileSync(resolve(__dirname, '..', 'assets/css/style.css'), 'utf8');
const js = readFileSync(resolve(__dirname, '..', 'assets/js/script.js'), 'utf8');

test('click and selected states use an Apple-style glass treatment', () => {
  assert.match(css, /--glass-surface:/);
  assert.match(css, /--glass-border:/);
  assert.match(css, /\.glass-press[\s\S]*backdrop-filter:\s*blur\(/);
  assert.match(css, /\.btn:active[\s\S]*backdrop-filter:\s*blur\(/);
  assert.match(css, /\.nav-links a\[aria-current="page"\][\s\S]*backdrop-filter:\s*blur\(/);
  assert.match(js, /glass-press/);
});
