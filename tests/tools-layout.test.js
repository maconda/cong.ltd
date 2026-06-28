const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const toolsUrl = `file:///${resolve(__dirname, '..', 'tools.html').replace(/\\/g, '/')}`;

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

const fetchJsonWithRetry = async (url, attempts = 40) => {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError;
};

const openCdp = async (webSocketDebuggerUrl) => {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });

  let id = 0;
  const callbacks = new Map();
  const listeners = new Map();

  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data);
    if (payload.id && callbacks.has(payload.id)) {
      const { resolveMessage, rejectMessage } = callbacks.get(payload.id);
      callbacks.delete(payload.id);
      if (payload.error) rejectMessage(new Error(payload.error.message));
      else resolveMessage(payload.result);
      return;
    }

    const waiters = listeners.get(payload.method);
    if (waiters?.length) waiters.shift()(payload.params);
  });

  return {
    send(method, params = {}) {
      id += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveMessage, rejectMessage) => {
        callbacks.set(id, { resolveMessage, rejectMessage });
      });
    },
    waitFor(method, timeout = 5000) {
      return new Promise((resolveWait, rejectWait) => {
        const timer = setTimeout(() => rejectWait(new Error(`Timed out waiting for ${method}`)), timeout);
        const waiters = listeners.get(method) || [];
        waiters.push((params) => {
          clearTimeout(timer);
          resolveWait(params);
        });
        listeners.set(method, waiters);
      });
    },
    close() {
      socket.close();
    }
  };
};

const withToolsPage = async (viewport, callback) => {
  const port = 9333 + Math.floor(Math.random() * 400);
  const profile = mkdtempSync(join(tmpdir(), 'cong-layout-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  try {
    const targets = await fetchJsonWithRetry(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find((target) => target.type === 'page');
    assert.ok(pageTarget?.webSocketDebuggerUrl, 'Chrome did not expose a page target');
    cdp = await openCdp(pageTarget.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: Boolean(viewport.mobile)
    });
    const loaded = cdp.waitFor('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: toolsUrl });
    await loaded;
    await delay(400);

    await callback(cdp);
  } finally {
    if (cdp) {
      try {
        await cdp.send('Browser.close');
      } catch {}
      cdp.close();
    }
    if (!chrome.killed) chrome.kill();
    await Promise.race([
      new Promise((resolveExit) => chrome.once('exit', resolveExit)),
      delay(1500)
    ]);
    rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
  }
};

const waitForRuntimeValue = async (cdp, expression, timeout = 6000) => {
  const deadline = Date.now() + timeout;
  let lastValue;
  while (Date.now() < deadline) {
    const { result } = await cdp.send('Runtime.evaluate', { returnByValue: true, expression });
    lastValue = result.value;
    if (lastValue) return lastValue;
    await delay(100);
  }
  return lastValue;
};

test('tools page does not create horizontal overflow on a 390px viewport', async () => {
  await withToolsPage({ width: 390, height: 3000, mobile: true }, async (cdp) => {
    const { result } = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const root = document.documentElement;
        const body = document.body;
        const overflow = root.scrollWidth - root.clientWidth;
        const offenders = [...document.querySelectorAll('body *')]
          .filter((node) => node.getBoundingClientRect().right > root.clientWidth + 1)
          .slice(0, 8)
          .map((node) => ({
            tag: node.tagName.toLowerCase(),
            className: node.className,
            id: node.id,
            right: Math.round(node.getBoundingClientRect().right),
            text: node.textContent.trim().slice(0, 32)
          }));
        return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, bodyWidth: body.scrollWidth, overflow, offenders };
      })()`
    });

    assert.equal(result.value.overflow, 0, JSON.stringify(result.value, null, 2));
  });
});

test('manual employee and prize input can start a lottery round in the browser', async () => {
  await withToolsPage({ width: 1180, height: 1400, mobile: false }, async (cdp) => {
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const employees = document.getElementById('lottery-employees');
        const prizes = document.getElementById('lottery-prizes');
        employees.value = '张三\\n李四';
        prizes.value = '一等奖';
        employees.dispatchEvent(new Event('input', { bubbles: true }));
        prizes.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('lottery-draw').click();
      })()`
    });

    const resultText = await waitForRuntimeValue(cdp, `(() => {
      const status = document.getElementById('lottery-status')?.textContent || '';
      const results = document.getElementById('lottery-results')?.textContent || '';
      if (!/已揭晓/.test(status) || !/一等奖/.test(results)) return '';
      return status + '|' + results;
    })()`);

    assert.match(resultText, /一等奖 已揭晓 1 位中奖者/);
  });
});
