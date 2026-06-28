(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof globalThis !== 'undefined' ? globalThis : root);
  } else {
    Object.assign(root, factory(root));
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, (globalRoot) => {
  const employeeAliases = {
    name: ['姓名', '员工', 'name'],
    department: ['部门', 'department', 'dept']
  };

  const prizeAliases = {
    level: ['奖项', '等级', 'level'],
    gift: ['礼品', '奖品', 'gift', 'prize'],
    quantity: ['数量', '名额', 'count', 'quantity']
  };

  const normalizeCell = (value) => String(value ?? '').trim();

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const splitManualLine = (line) => normalizeCell(line)
    .split(/\t|,|，/)
    .map((item) => item.trim());

  const compactRows = (rows) => rows
    .map((row) => Array.from(row || []).map(normalizeCell))
    .filter((row) => row.some(Boolean));

  const findHeaderIndex = (headers, aliases) => {
    const normalized = headers.map((header) => header.toLowerCase());
    return aliases.reduce((index, alias) => {
      if (index >= 0) return index;
      return normalized.indexOf(alias.toLowerCase());
    }, -1);
  };

  const buildColumnMap = (headers, aliasMap, fallback) => {
    const map = {};
    let matched = false;

    Object.entries(aliasMap).forEach(([key, aliases]) => {
      const index = findHeaderIndex(headers, aliases);
      if (index >= 0) {
        map[key] = index;
        matched = true;
      } else {
        map[key] = fallback[key];
      }
    });

    return { map, matched };
  };

  const dedupeEmployees = (employees) => {
    const seen = new Set();
    return employees.filter((employee) => {
      const name = normalizeCell(employee.name);
      if (!name) return false;
      const department = normalizeCell(employee.department);
      const key = `${name}::${department}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((employee) => ({
      name: normalizeCell(employee.name),
      department: normalizeCell(employee.department)
    }));
  };

  const parseEmployeesFromRows = (rows) => {
    const normalizedRows = compactRows(rows);
    if (!normalizedRows.length) return [];

    const fallback = { name: 0, department: 1 };
    const { map, matched } = buildColumnMap(normalizedRows[0], employeeAliases, fallback);
    const dataRows = matched ? normalizedRows.slice(1) : normalizedRows;

    return dedupeEmployees(dataRows.map((row) => ({
      name: row[map.name],
      department: row[map.department]
    })));
  };

  const parseEmployeesFromText = (text) => parseEmployeesFromRows(
    normalizeCell(text).split(/\r?\n/).map(splitManualLine)
  );

  const normalizeQuantity = (value) => {
    const number = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
    return Number.isFinite(number) && number > 0 ? number : 0;
  };

  const looksLikeQuantity = (value) => /^\d+$/.test(normalizeCell(value));

  const normalizePrizeRow = (row, map, matchedHeaders) => {
    if (matchedHeaders) {
      const level = normalizeCell(row[map.level]);
      const gift = normalizeCell(row[map.gift]) || level;
      const rawQuantity = normalizeCell(row[map.quantity]);
      const quantity = rawQuantity ? normalizeQuantity(rawQuantity) : 1;
      return { level, gift, quantity };
    }

    const level = normalizeCell(row[0]);
    const second = normalizeCell(row[1]);
    const third = normalizeCell(row[2]);
    if (!level) return { level: '', gift: '', quantity: 0 };

    if (third) {
      return {
        level,
        gift: second || level,
        quantity: normalizeQuantity(third)
      };
    }

    if (looksLikeQuantity(second)) {
      return {
        level,
        gift: level,
        quantity: normalizeQuantity(second)
      };
    }

    return {
      level,
      gift: second || level,
      quantity: 1
    };
  };

  const parsePrizesFromRows = (rows) => {
    const normalizedRows = compactRows(rows);
    if (!normalizedRows.length) return [];

    const fallback = { level: 0, gift: 1, quantity: 2 };
    const { map, matched } = buildColumnMap(normalizedRows[0], prizeAliases, fallback);
    const dataRows = matched ? normalizedRows.slice(1) : normalizedRows;

    return dataRows
      .map((row) => normalizePrizeRow(row, map, matched))
      .filter((prize) => prize.level && prize.gift && prize.quantity > 0);
  };

  const parsePrizesFromText = (text) => parsePrizesFromRows(
    normalizeCell(text).split(/\r?\n/).map(splitManualLine)
  );

  const getPrizeQuantityOptions = (employeeCount, reservedCount = 0, maxVisible = 12) => {
    const remaining = Math.max(0, Math.floor(Number(employeeCount) || 0) - Math.floor(Number(reservedCount) || 0));
    const limit = Math.min(remaining, Math.max(0, Math.floor(Number(maxVisible) || 0)));
    return Array.from({ length: limit }, (_, index) => index + 1);
  };

  const secureRandomIndex = (max) => {
    if (max <= 1) return 0;

    const cryptoApi = typeof crypto !== 'undefined' ? crypto : null;
    if (cryptoApi?.getRandomValues) {
      const array = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / max) * max;
      do {
        cryptoApi.getRandomValues(array);
      } while (array[0] >= limit);
      return array[0] % max;
    }

    return Math.floor(Math.random() * max);
  };

  const coerceRandomIndex = (max, randomIndex) => {
    const raw = randomIndex(max);
    if (Number.isInteger(raw) && raw >= 0 && raw < max) return raw;
    if (Number.isFinite(raw) && raw >= 0 && raw < 1) return Math.floor(raw * max);
    return Math.abs(Math.trunc(Number(raw) || 0)) % max;
  };

  const normalizeEmployees = (employees) => dedupeEmployees(Array.isArray(employees) ? employees : []);

  const normalizePrizes = (prizes) => (Array.isArray(prizes) ? prizes : [])
    .map((prize) => ({
      level: normalizeCell(prize.level),
      gift: normalizeCell(prize.gift),
      quantity: normalizeQuantity(prize.quantity)
    }))
    .filter((prize) => prize.level && prize.gift && prize.quantity > 0);

  const cloneSession = (session) => ({
    remainingEmployees: normalizeEmployees(session?.remainingEmployees || []),
    pendingPrizes: normalizePrizes(session?.pendingPrizes || []),
    completedGroups: Array.isArray(session?.completedGroups) ? session.completedGroups.map((group) => ({
      level: normalizeCell(group.level),
      gift: normalizeCell(group.gift),
      quantity: normalizeQuantity(group.quantity),
      winners: Array.isArray(group.winners) ? group.winners.map((winner) => ({
        level: normalizeCell(winner.level),
        gift: normalizeCell(winner.gift),
        employee: {
          name: normalizeCell(winner.employee?.name),
          department: normalizeCell(winner.employee?.department)
        }
      })) : []
    })) : []
  });

  const createLotterySession = (employees, prizes) => ({
    remainingEmployees: normalizeEmployees(employees),
    pendingPrizes: normalizePrizes(prizes),
    completedGroups: []
  });

  const drawPrizeRound = (session, prizeIndex = 0, randomIndex = secureRandomIndex) => {
    const nextSession = cloneSession(session);
    const index = Math.trunc(Number(prizeIndex) || 0);
    const prize = nextSession.pendingPrizes[index];

    if (!nextSession.remainingEmployees.length) {
      return { ok: false, message: '员工池没有可抽取人员', session: nextSession, group: null };
    }

    if (!prize) {
      return { ok: false, message: '请选择要抽取的奖项', session: nextSession, group: null };
    }

    if (prize.quantity > nextSession.remainingEmployees.length) {
      return {
        ok: false,
        message: `本轮人数不足：${prize.level} 需要 ${prize.quantity} 人，当前剩余 ${nextSession.remainingEmployees.length} 人`,
        session: nextSession,
        group: null
      };
    }

    const winners = [];
    for (let count = 0; count < prize.quantity; count += 1) {
      const employeeIndex = coerceRandomIndex(nextSession.remainingEmployees.length, randomIndex);
      const [employee] = nextSession.remainingEmployees.splice(employeeIndex, 1);
      winners.push({ level: prize.level, gift: prize.gift, employee });
    }

    const group = { ...prize, winners };
    nextSession.pendingPrizes.splice(index, 1);
    nextSession.completedGroups.push(group);

    return {
      ok: true,
      message: `${prize.level} 已揭晓 ${winners.length} 位中奖者`,
      session: nextSession,
      group
    };
  };

  const drawAnnualLottery = (employees, prizes, randomIndex = secureRandomIndex) => {
    const employeePool = normalizeEmployees(employees);
    const prizePool = normalizePrizes(prizes);
    const totalWinners = prizePool.reduce((sum, prize) => sum + prize.quantity, 0);

    if (!employeePool.length) {
      return { ok: false, message: '请先建立员工池', groups: [] };
    }

    if (!prizePool.length) {
      return { ok: false, message: '请先建立礼品池', groups: [] };
    }

    if (totalWinners > employeePool.length) {
      return {
        ok: false,
        message: `员工池人数不足：需要 ${totalWinners} 人，当前只有 ${employeePool.length} 人`,
        groups: []
      };
    }

    let session = createLotterySession(employeePool, prizePool);
    while (session.pendingPrizes.length) {
      const round = drawPrizeRound(session, 0, randomIndex);
      if (!round.ok) return { ok: false, message: round.message, groups: session.completedGroups };
      session = round.session;
    }

    return { ok: true, message: `已完成 ${totalWinners} 个名额抽取`, groups: session.completedGroups };
  };

  const renderList = (items, formatter, emptyText) => {
    if (!items.length) return `<span class="lottery-empty">${emptyText}</span>`;
    return items.slice(0, 6).map(formatter).join('');
  };

  const readWorkbookRows = (file) => new Promise((resolve, reject) => {
    if (!globalRoot.XLSX) {
      reject(new Error('Excel 解析库加载失败'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = globalRoot.XLSX.read(reader.result, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(globalRoot.XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });

  const initAnnualLotteryTool = () => {
    const employeeInput = document.getElementById('lottery-employees');
    const employeeFile = document.getElementById('lottery-employee-file');
    const employeeCount = document.getElementById('lottery-employee-count');
    const employeePreview = document.getElementById('lottery-employee-preview');
    const prizeInput = document.getElementById('lottery-prizes');
    const prizeFile = document.getElementById('lottery-prize-file');
    const prizeCount = document.getElementById('lottery-prize-count');
    const prizeTotal = document.getElementById('lottery-prize-total');
    const prizePreview = document.getElementById('lottery-prize-preview');
    const builderLevel = document.getElementById('lottery-builder-level');
    const builderGift = document.getElementById('lottery-builder-gift');
    const builderQuantity = document.getElementById('lottery-builder-quantity');
    const builderAdd = document.getElementById('lottery-builder-add');
    const prizeSelect = document.getElementById('lottery-prize-select');
    const stagePrize = document.getElementById('lottery-stage-prize');
    const stageName = document.getElementById('lottery-stage-name');
    const stageDepartment = document.getElementById('lottery-stage-dept');
    const progressBar = document.getElementById('lottery-progress-bar');
    const remainingCount = document.getElementById('lottery-remaining-count');
    const roundCount = document.getElementById('lottery-round-count');
    const drawButton = document.getElementById('lottery-draw');
    const resetButton = document.getElementById('lottery-reset');
    const status = document.getElementById('lottery-status');
    const results = document.getElementById('lottery-results');

    const required = [employeeInput, employeeFile, employeeCount, employeePreview, prizeInput, prizeFile, prizeCount, prizeTotal, prizePreview, builderLevel, builderGift, builderQuantity, builderAdd, prizeSelect, stagePrize, stageName, stageDepartment, progressBar, remainingCount, roundCount, drawButton, resetButton, status, results];
    if (required.some((item) => !item)) return;

    let importedEmployees = [];
    let importedPrizes = [];
    let session = createLotterySession([], []);
    let isDrawing = false;

    const setStatus = (message, tone = 'neutral') => {
      status.textContent = message;
      status.dataset.tone = tone;
    };

    const getEmployees = () => dedupeEmployees([
      ...parseEmployeesFromText(employeeInput.value),
      ...importedEmployees
    ]);

    const getPrizes = () => [
      ...parsePrizesFromText(prizeInput.value),
      ...importedPrizes
    ];

    const renderResults = () => {
      results.innerHTML = session.completedGroups.map((group) => `
        <section class="lottery-result-group">
          <h4>${escapeHTML(group.level)} · ${escapeHTML(group.gift)}</h4>
          <div class="lottery-winners">
            ${group.winners.map((winner) => `
              <div class="lottery-winner">
                <strong>${escapeHTML(winner.employee.name)}</strong>
                <span>${escapeHTML(winner.employee.department || '未填写部门')}</span>
              </div>
            `).join('')}
          </div>
        </section>
      `).join('');
    };

    const renderStage = (preserveDisplay = false) => {
      const selectedIndex = Math.min(Number(prizeSelect.value) || 0, Math.max(session.pendingPrizes.length - 1, 0));
      const selectedPrize = session.pendingPrizes[selectedIndex];

      prizeSelect.innerHTML = session.pendingPrizes.length
        ? session.pendingPrizes.map((prize, index) => `<option value="${index}">${escapeHTML(prize.level)} · ${escapeHTML(prize.gift)} · ${prize.quantity} 名</option>`).join('')
        : '<option value="0">暂无待抽奖项</option>';
      prizeSelect.value = String(selectedIndex);
      prizeSelect.disabled = isDrawing || !session.pendingPrizes.length;

      remainingCount.textContent = `剩余 ${session.remainingEmployees.length} 人`;
      roundCount.textContent = `待抽 ${session.pendingPrizes.length} 轮`;
      drawButton.disabled = isDrawing || !session.pendingPrizes.length;
      resetButton.disabled = isDrawing;

      if (!isDrawing && !preserveDisplay) {
        stagePrize.textContent = selectedPrize ? `${selectedPrize.level} · ${selectedPrize.gift} · ${selectedPrize.quantity} 名` : '等待奖项';
        stageName.textContent = selectedPrize ? 'READY' : 'DONE';
        stageDepartment.textContent = selectedPrize ? '点击启动本轮抽奖' : '全部奖项已完成';
        progressBar.style.width = selectedPrize ? '0%' : '100%';
      }
    };

    const resetSession = (message = '抽奖流程已重置，准备开始第一轮') => {
      session = createLotterySession(getEmployees(), getPrizes());
      results.innerHTML = '';
      setStatus(message, 'neutral');
      renderStage();
    };

    const renderPools = (shouldResetSession = false) => {
      const employees = getEmployees();
      const prizes = getPrizes();
      const total = prizes.reduce((sum, prize) => sum + prize.quantity, 0);
      const quantityOptions = getPrizeQuantityOptions(employees.length, total);

      employeeCount.textContent = `${employees.length} 人`;
      prizeCount.textContent = `${prizes.length} 项`;
      prizeTotal.textContent = `${total} 个名额`;
      employeePreview.innerHTML = renderList(
        employees,
        (employee) => `<div><strong>${escapeHTML(employee.name)}</strong><span>${escapeHTML(employee.department || '未填写部门')}</span></div>`,
        '等待导入员工'
      );
      prizePreview.innerHTML = renderList(
        prizes,
        (prize) => `<div><strong>${escapeHTML(prize.level)} · ${escapeHTML(prize.gift)}</strong><span>${prize.quantity} 个名额</span></div>`,
        '等待导入礼品'
      );
      builderQuantity.innerHTML = quantityOptions.length
        ? quantityOptions.map((quantity) => `<option value="${quantity}">${quantity} 人</option>`).join('')
        : '<option value="0">无可用名额</option>';
      builderQuantity.disabled = !quantityOptions.length;
      builderAdd.disabled = !quantityOptions.length;

      if (shouldResetSession) {
        resetSession('数据池已更新，抽奖流程已重置');
      } else {
        renderStage();
      }
    };

    employeeInput.addEventListener('input', () => renderPools(true));
    prizeInput.addEventListener('input', () => renderPools(true));

    builderAdd.addEventListener('click', () => {
      const quantity = Number(builderQuantity.value) || 0;
      if (quantity <= 0) {
        setStatus('没有可用抽奖名额，请先增加员工或减少已设置名额', 'error');
        return;
      }

      const level = normalizeCell(builderLevel.value);
      const gift = normalizeCell(builderGift.value) || level;
      const line = `${level},${gift},${quantity}`;
      prizeInput.value = [prizeInput.value.trim(), line].filter(Boolean).join('\n');
      builderGift.value = '';
      renderPools(true);
      setStatus(`已添加 ${level}，中奖人数 ${quantity} 人`, 'success');
    });

    employeeFile.addEventListener('change', async () => {
      const file = employeeFile.files?.[0];
      if (!file) return;

      try {
        importedEmployees = parseEmployeesFromRows(await readWorkbookRows(file));
        setStatus(`已从 Excel 导入 ${importedEmployees.length} 名员工`, 'success');
      } catch (error) {
        importedEmployees = [];
        setStatus('员工 Excel 解析失败，请检查文件格式', 'error');
      }
      renderPools(true);
    });

    prizeFile.addEventListener('change', async () => {
      const file = prizeFile.files?.[0];
      if (!file) return;

      try {
        importedPrizes = parsePrizesFromRows(await readWorkbookRows(file));
        setStatus(`已从 Excel 导入 ${importedPrizes.length} 项礼品`, 'success');
      } catch (error) {
        importedPrizes = [];
        setStatus('礼品 Excel 解析失败，请检查文件格式', 'error');
      }
      renderPools(true);
    });

    prizeSelect.addEventListener('change', renderStage);

    drawButton.addEventListener('click', () => {
      if (isDrawing) return;

      if (!session.pendingPrizes.length) {
        resetSession('已根据当前数据池重新准备抽奖流程');
      }

      const selectedIndex = Number(prizeSelect.value) || 0;
      const prize = session.pendingPrizes[selectedIndex];
      if (!prize) {
        setStatus('没有可抽取的奖项，请先建立礼品池', 'error');
        return;
      }

      if (prize.quantity > session.remainingEmployees.length) {
        setStatus(`本轮人数不足：${prize.level} 需要 ${prize.quantity} 人，当前剩余 ${session.remainingEmployees.length} 人`, 'error');
        return;
      }

      isDrawing = true;
      setStatus(`${prize.level} 正在滚动候选名单`, 'neutral');
      renderStage();

      const startedAt = Date.now();
      const duration = Math.max(1800, Math.min(3600, 1400 + prize.quantity * 520));
      const candidates = session.remainingEmployees.slice();
      const ticker = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const ratio = Math.min(elapsed / duration, 1);
        const candidate = candidates[secureRandomIndex(candidates.length)];
        stagePrize.textContent = `${prize.level} · ${prize.gift}`;
        stageName.textContent = candidate?.name || 'READY';
        stageDepartment.textContent = candidate?.department || '未填写部门';
        progressBar.style.width = `${Math.round(ratio * 100)}%`;
      }, 68);

      window.setTimeout(() => {
        window.clearInterval(ticker);
        const result = drawPrizeRound(session, selectedIndex);
        isDrawing = false;

        if (!result.ok) {
          setStatus(result.message, 'error');
          renderStage();
          return;
        }

        session = result.session;
        renderResults();
        stagePrize.textContent = `${result.group.level} · ${result.group.gift}`;
        stageName.textContent = result.group.winners.map((winner) => winner.employee.name).join(' / ');
        stageDepartment.textContent = `本轮 ${result.group.winners.length} 位中奖者已揭晓`;
        progressBar.style.width = '100%';
        setStatus(result.message, 'success');
        renderStage(true);
      }, duration);
    });

    resetButton.addEventListener('click', () => {
      resetSession('整场抽奖已重置，员工池和礼品池保留');
    });

    employeeInput.value = '张三,设计部\n李四,技术部\n王五,行政部\n赵六,财务部';
    prizeInput.value = '一等奖,MacBook Pro,1\n二等奖,显示器,2';
    renderPools(true);
    setStatus('可以手动输入，也可以上传 Excel 导入数据池', 'neutral');
  };

  return {
    parseEmployeesFromText,
    parsePrizesFromText,
    parseEmployeesFromRows,
    parsePrizesFromRows,
    getPrizeQuantityOptions,
    createLotterySession,
    drawPrizeRound,
    drawAnnualLottery,
    initAnnualLotteryTool
  };
}));
