# Annual Lottery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, browser-only year-end party lottery tool on the existing `tools.html` page with a staged live-draw flow.

**Architecture:** Put parser, staged session state, and draw behavior in `assets/js/annual-lottery.js` as pure functions plus a browser initializer. Keep UI markup in `tools.html`, styling in `assets/css/style.css`, and existing site initialization in `assets/js/script.js`.

**Tech Stack:** Plain HTML, CSS, JavaScript, SheetJS from CDN for Excel import, Node built-in `node:test` for logic tests.

---

## File Structure

- Create `assets/js/annual-lottery.js`: employee parser, prize parser, secure random index helper, staged session engine, browser UI initializer, CommonJS exports for tests.
- Create `tests/annual-lottery.test.js`: Node tests for parsing and drawing.
- Modify `tools.html`: add SheetJS CDN and the annual lottery card.
- Modify `assets/js/script.js`: call `window.initAnnualLotteryTool` on page load when present.
- Modify `assets/css/style.css`: add lottery-specific layout, preview, status, and result styling.

### Task 1: Core Logic Tests

**Files:**
- Create: `tests/annual-lottery.test.js`
- Create: `assets/js/annual-lottery.js`

- [ ] **Step 1: Write failing parser and draw tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseEmployeesFromText,
  parsePrizesFromText,
  parseEmployeesFromRows,
  createLotterySession,
  drawPrizeRound,
  drawAnnualLottery
} = require('../assets/js/annual-lottery.js');

test('parses employees from manual text and removes duplicates', () => {
  const employees = parseEmployeesFromText('张三,设计部\n李四\t技术部\n张三,设计部\n,空行');
  assert.deepEqual(employees, [
    { name: '张三', department: '设计部' },
    { name: '李四', department: '技术部' }
  ]);
});

test('parses prizes from manual text and keeps only positive quantities', () => {
  const prizes = parsePrizesFromText('一等奖,MacBook,1\n二等奖\t显示器\t2\n三等奖,无效,0');
  assert.deepEqual(prizes, [
    { level: '一等奖', gift: 'MacBook', quantity: 1 },
    { level: '二等奖', gift: '显示器', quantity: 2 }
  ]);
});

test('parses employees from rows with Chinese headers', () => {
  const rows = [
    ['姓名', '部门'],
    ['王五', '行政部'],
    ['赵六', '财务部']
  ];
  assert.deepEqual(parseEmployeesFromRows(rows), [
    { name: '王五', department: '行政部' },
    { name: '赵六', department: '财务部' }
  ]);
});

test('draws exact winners without duplicates', () => {
  const employees = [
    { name: 'A', department: '设计' },
    { name: 'B', department: '技术' },
    { name: 'C', department: '行政' }
  ];
  const prizes = [{ level: '一等奖', gift: '礼品', quantity: 2 }];
  const result = drawAnnualLottery(employees, prizes, () => 0);
  assert.equal(result.ok, true);
  assert.equal(result.groups[0].winners.length, 2);
  assert.deepEqual(result.groups[0].winners.map((item) => item.employee.name), ['A', 'B']);
});

test('draws a selected prize round and removes winners from the remaining pool', () => {
  const session = createLotterySession(
    [
      { name: 'A', department: '设计' },
      { name: 'B', department: '技术' },
      { name: 'C', department: '行政' }
    ],
    [
      { level: '二等奖', gift: '显示器', quantity: 2 },
      { level: '一等奖', gift: 'MacBook', quantity: 1 }
    ]
  );

  const result = drawPrizeRound(session, 0, () => 0);
  assert.equal(result.ok, true);
  assert.deepEqual(result.group.winners.map((item) => item.employee.name), ['A', 'B']);
  assert.deepEqual(result.session.remainingEmployees.map((item) => item.name), ['C']);
  assert.deepEqual(result.session.pendingPrizes.map((item) => item.level), ['一等奖']);
});

test('rejects drawing when prizes require more employees than available', () => {
  const result = drawAnnualLottery(
    [{ name: 'A', department: '设计' }],
    [{ level: '一等奖', gift: '礼品', quantity: 2 }],
    () => 0
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /员工池人数不足/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/annual-lottery.test.js`

Expected: FAIL because `assets/js/annual-lottery.js` does not exist or exported functions are missing.

- [ ] **Step 3: Implement minimal core logic**

Create `assets/js/annual-lottery.js` with the tested parser and draw functions. Use a UMD wrapper so the same file works in browser and Node.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/annual-lottery.test.js`

Expected: PASS with 5 passing tests.

### Task 2: Tools Page UI

**Files:**
- Modify: `tools.html`
- Modify: `assets/css/style.css`
- Modify: `assets/js/script.js`

- [ ] **Step 1: Add the lottery card markup**

Add a `03` tool card after the finance tool with employee textarea/upload, prize textarea/upload, pool stats, action buttons, and result containers.

- [ ] **Step 2: Add SheetJS and lottery scripts**

Load `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js` before `assets/js/annual-lottery.js`, then keep `assets/js/script.js` last with `defer`.

- [ ] **Step 3: Add browser UI initializer**

Implement `initAnnualLotteryTool` in `assets/js/annual-lottery.js`. It reads textareas and files, parses rows through SheetJS, renders previews and status, builds a staged session, rolls candidate names, and calls `drawPrizeRound` for the selected prize.

- [ ] **Step 4: Wire initializer from existing script**

In `assets/js/script.js`, call `window.initAnnualLotteryTool` on load if it is a function.

- [ ] **Step 5: Style the lottery UI**

Add CSS for `.lottery-tool`, `.lottery-app`, `.lottery-panels`, `.lottery-panel`, `.lottery-stats`, `.lottery-preview`, `.lottery-status`, and `.lottery-results`.

### Task 3: Verification

**Files:**
- Verify: `tests/annual-lottery.test.js`
- Verify: `tools.html`
- Verify: `assets/js/annual-lottery.js`
- Verify: `assets/css/style.css`

- [ ] **Step 1: Run unit tests**

Run: `node --test tests/annual-lottery.test.js`

Expected: all tests pass.

- [ ] **Step 2: Run static site verification**

Run: `powershell -ExecutionPolicy Bypass -File tools/verify-static-site.ps1`

Expected: script completes successfully.

- [ ] **Step 3: Preview locally**

Run or reuse: `python -m http.server 8000 --bind 127.0.0.1`

Open: `http://127.0.0.1:8000/tools.html`

Expected: the page loads, existing QR and finance tools still render, and the annual lottery card can parse sample manual data and draw grouped winners.

## Self-Review

- Spec coverage: employee pool, prize pool, Excel import, manual input, random drawing, duplicate prevention, and errors are covered by tasks.
- Placeholder scan: no TBD, TODO, or unresolved task details remain.
- Type consistency: parser and draw function names match the test plan and implementation file.
