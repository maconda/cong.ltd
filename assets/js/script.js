const menuButton = document.querySelector('.menu-btn');
const mobileLinks = document.querySelectorAll('.mobile-menu a');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
const setMenu = (open) => {
  document.body.classList.toggle('menu-open', open);
  if (menuButton) menuButton.setAttribute('aria-expanded', String(open));
};

menuButton?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
mobileLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

const setActiveNavigation = () => {
  const activeHash = window.location.hash || '#top';
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const isHashLink = href.startsWith('#');
    const isFileLink = !isHashLink && href.split('#')[0] === currentPath;
    const isActive = (isHashLink && href === activeHash) || isFileLink;
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

navLinks.forEach((link) => link.addEventListener('click', () => {
  window.requestAnimationFrame(setActiveNavigation);
}));
window.addEventListener('hashchange', setActiveNavigation);
setActiveNavigation();

const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
if (prefersReduced || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    io.observe(item);
  });
}

const initQrTool = () => {
  const input = document.getElementById('qr-input');
  const output = document.getElementById('qr-output');
  const generateButton = document.getElementById('qr-generate');
  const downloadLink = document.getElementById('qr-download');

  if (!input || !output || !generateButton || !downloadLink) return;

  const setDownload = (url) => {
    downloadLink.href = url;
    downloadLink.classList.remove('disabled');
    downloadLink.removeAttribute('aria-disabled');
  };

  const setMessage = (message) => {
    output.innerHTML = `<span class="qr-message">${message}</span>`;
    downloadLink.href = '#';
    downloadLink.classList.add('disabled');
    downloadLink.setAttribute('aria-disabled', 'true');
  };

  const renderQr = async () => {
    const value = input.value.trim();
    if (!value) {
      setMessage('请输入需要转换的内容');
      input.focus();
      return;
    }

    if (typeof window.qrcode !== 'function') {
      setMessage('二维码工具加载失败，请刷新页面再试');
      return;
    }

    output.innerHTML = '';

    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(value);
      qr.make();

      const margin = 2;
      const cellSize = 8;
      const moduleCount = qr.getModuleCount();
      const canvas = document.createElement('canvas');
      const size = (moduleCount + margin * 2) * cellSize;
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, size, size);
      context.fillStyle = '#050509';
      for (let row = 0; row < moduleCount; row += 1) {
        for (let col = 0; col < moduleCount; col += 1) {
          if (qr.isDark(row, col)) {
            context.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
          }
        }
      }

      const image = document.createElement('img');
      image.alt = '生成的二维码';
      image.src = canvas.toDataURL('image/png');
      output.appendChild(image);
      setDownload(image.src);
    } catch (error) {
      setMessage('内容过长或格式异常，暂时无法生成二维码');
    }
  };

  generateButton.addEventListener('click', renderQr);
  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      renderQr();
    }
  });

  input.value = 'https://cong.ltd';
  renderQr();
};

const clampNumber = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
};

const formatCurrency = (value) => new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY'
}).format(value);

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const convertIntegerToChineseUppercase = (integer) => {
  if (integer === 0) return '零';

  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const sectionUnits = ['', '万', '亿', '兆'];
  const groups = [];
  let value = String(integer);

  while (value.length > 0) {
    groups.unshift(value.slice(-4));
    value = value.slice(0, -4);
  }

  const sectionToText = (section) => {
    const padded = String(Number(section)).padStart(4, '0');
    let text = '';
    let hasZero = false;

    for (let index = 0; index < padded.length; index += 1) {
      const digit = Number(padded[index]);
      const unit = units[padded.length - 1 - index];
      if (digit === 0) {
        if (text) hasZero = true;
      } else {
        if (hasZero) {
          text += digits[0];
          hasZero = false;
        }
        text += `${digits[digit]}${unit}`;
      }
    }

    return text;
  };

  return groups.reduce((text, group, index) => {
    const number = Number(group);
    const unit = sectionUnits[groups.length - 1 - index];
    if (number === 0) {
      return text && !text.endsWith('零') ? `${text}零` : text;
    }

    const prefix = text && number < 1000 && !text.endsWith('零') ? '零' : '';
    return `${text}${prefix}${sectionToText(group)}${unit}`;
  }, '').replace(/零+/g, '零').replace(/零$/g, '');
};

const convertAmountToChineseUppercase = (amount) => {
  const number = Number(amount);
  if (!Number.isFinite(number)) return '零元整';

  const sign = number < 0 ? '负' : '';
  const cents = Math.round(Math.abs(number) * 100);
  const integer = Math.floor(cents / 100);
  const jiao = Math.floor((cents % 100) / 10);
  const fen = cents % 10;
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const integerText = convertIntegerToChineseUppercase(integer);

  let decimalText = '整';
  if (jiao > 0 && fen > 0) {
    decimalText = `${digits[jiao]}角${digits[fen]}分`;
  } else if (jiao > 0) {
    decimalText = `${digits[jiao]}角`;
  } else if (fen > 0) {
    decimalText = `${integer > 0 ? '零' : ''}${digits[fen]}分`;
  }

  return `${sign}${integerText}元${decimalText}`;
};

window.convertAmountToChineseUppercase = convertAmountToChineseUppercase;

const initFinanceTool = () => {
  const baseInput = document.getElementById('finance-base');
  const discountInput = document.getElementById('finance-discount');
  const taxInput = document.getElementById('finance-tax');
  const rangeInput = document.getElementById('finance-range');
  const noteInput = document.getElementById('finance-note');
  const totalOutput = document.getElementById('finance-total');
  const uppercaseOutput = document.getElementById('finance-uppercase');
  const budgetOutput = document.getElementById('finance-budget');
  const detailOutput = document.getElementById('finance-detail');
  const saveButton = document.getElementById('finance-save');
  const clearButton = document.getElementById('finance-clear');
  const recordsOutput = document.getElementById('finance-records');

  const required = [baseInput, discountInput, taxInput, rangeInput, noteInput, totalOutput, uppercaseOutput, budgetOutput, detailOutput, saveButton, clearButton, recordsOutput];
  if (required.some((item) => !item)) return;

  const storageKey = 'cong-finance-records';
  const readRecords = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      return [];
    }
  };

  const writeRecords = (records) => {
    localStorage.setItem(storageKey, JSON.stringify(records.slice(0, 5)));
  };

  const calculate = () => {
    const base = clampNumber(baseInput.value);
    const discountRate = clampNumber(discountInput.value, 0, 100);
    const taxRate = clampNumber(taxInput.value, 0, 100);
    const rangeRate = clampNumber(rangeInput.value, 0, 100);
    const discount = base * (discountRate / 100);
    const afterDiscount = Math.max(base - discount, 0);
    const tax = afterDiscount * (taxRate / 100);
    const total = afterDiscount + tax;
    const low = total * (1 - rangeRate / 100);
    const high = total * (1 + rangeRate / 100);

    return { base, discount, tax, total, low, high, discountRate, taxRate, rangeRate };
  };

  const renderRecords = () => {
    const records = readRecords();
    recordsOutput.innerHTML = records.map((record) => `
      <div class="finance-record">
        <span>${escapeHTML(record.time)}</span>
        <strong>${escapeHTML(record.note || '未命名报价')} · ${escapeHTML(record.total)}</strong>
        <em>${escapeHTML(record.budget)}</em>
      </div>
    `).join('');
  };

  const render = () => {
    const result = calculate();
    totalOutput.textContent = formatCurrency(result.total);
    uppercaseOutput.textContent = convertAmountToChineseUppercase(result.total);
    budgetOutput.textContent = `${formatCurrency(result.low)} - ${formatCurrency(result.high)}`;
    detailOutput.textContent = `${formatCurrency(result.discount)} / ${formatCurrency(result.tax)}`;
  };

  [baseInput, discountInput, taxInput, rangeInput].forEach((input) => input.addEventListener('input', render));
  saveButton.addEventListener('click', () => {
    const result = calculate();
    const records = readRecords();
    records.unshift({
      note: noteInput.value.trim(),
      total: formatCurrency(result.total),
      budget: `${formatCurrency(result.low)} - ${formatCurrency(result.high)}`,
      time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    });
    writeRecords(records);
    renderRecords();
    noteInput.value = '';
  });
  clearButton.addEventListener('click', () => {
    writeRecords([]);
    renderRecords();
  });

  render();
  renderRecords();
};

window.addEventListener('load', initQrTool);
window.addEventListener('load', initFinanceTool);
