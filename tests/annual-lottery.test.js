const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseEmployeesFromText,
  parsePrizesFromText,
  parseEmployeesFromRows,
  parsePrizesFromRows,
  getPrizeQuantityOptions,
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

test('parses simple award names as drawable one-person prize rounds', () => {
  const prizes = parsePrizesFromText('一等奖\n二等奖,2\n三等奖,按摩椅');

  assert.deepEqual(prizes, [
    { level: '一等奖', gift: '一等奖', quantity: 1 },
    { level: '二等奖', gift: '二等奖', quantity: 2 },
    { level: '三等奖', gift: '按摩椅', quantity: 1 }
  ]);
});

test('limits winner-count options to remaining logical quota', () => {
  assert.deepEqual(getPrizeQuantityOptions(6, 2), [1, 2, 3, 4]);
  assert.deepEqual(getPrizeQuantityOptions(3, 3), []);
  assert.deepEqual(getPrizeQuantityOptions(20, 0, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
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

test('parses prizes from rows with logical headers', () => {
  const rows = [
    ['奖项', '礼品', '数量'],
    ['一等奖', 'MacBook', 1],
    ['二等奖', '显示器', '2']
  ];

  assert.deepEqual(parsePrizesFromRows(rows), [
    { level: '一等奖', gift: 'MacBook', quantity: 1 },
    { level: '二等奖', gift: '显示器', quantity: 2 }
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
  assert.equal(result.session.completedGroups.length, 1);
});

test('prevents duplicate winners across staged prize rounds', () => {
  const first = drawPrizeRound(createLotterySession(
    [
      { name: 'A', department: '设计' },
      { name: 'B', department: '技术' }
    ],
    [
      { level: '二等奖', gift: '显示器', quantity: 1 },
      { level: '一等奖', gift: 'MacBook', quantity: 1 }
    ]
  ), 0, () => 0);
  const second = drawPrizeRound(first.session, 0, () => 0);

  assert.equal(second.ok, true);
  assert.deepEqual(first.group.winners.map((item) => item.employee.name), ['A']);
  assert.deepEqual(second.group.winners.map((item) => item.employee.name), ['B']);
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
