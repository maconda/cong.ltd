# Airbnb Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `index.html`, `tools.html`, and `preowned.html` into a light Airbnb-inspired static site while preserving existing tool behavior and contact links.

**Architecture:** Keep the current plain static architecture: three HTML pages, one shared CSS file, and one shared JS file. Use CSS to create the new visual system, keep existing JS hook IDs stable, and add a small PowerShell verification script to protect static behavior.

**Tech Stack:** HTML, CSS, vanilla JavaScript, PowerShell verification, direct browser or `python -m http.server` preview.

---

## File Structure

- Create: `tools/verify-static-site.ps1`
  - Static checks for required pages, JS hook IDs, contact destinations, banned dominant dark-purple palette, and accidental em dashes in visible page copy.
- Modify: `assets/css/style.css`
  - Replace the dark purple glass system with a light Airbnb-style design system.
- Modify: `index.html`
  - Recompose the homepage into a light studio landing page with an image-led hero, entry cards, studio statement, and contact block.
- Modify: `tools.html`
  - Preserve QR and finance IDs while changing layout and copy hierarchy.
- Modify: `preowned.html`
  - Add image-led listing cards and keep existing product information and contact flow.
- Modify only if needed: `assets/js/script.js`
  - Keep behavior stable. Only change presentation-neutral selector support if new markup requires it.

## Task 1: Static Verification Guard

**Files:**
- Create: `tools/verify-static-site.ps1`

- [ ] **Step 1: Write the failing verification script**

Create `tools/verify-static-site.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pages = @("index.html", "tools.html", "preowned.html")
$requiredFiles = @(
  "assets/css/style.css",
  "assets/js/script.js"
)

$failures = New-Object System.Collections.Generic.List[string]

foreach ($page in $pages) {
  $path = Join-Path $root $page
  if (-not (Test-Path $path)) {
    $failures.Add("Missing page: $page")
    continue
  }

  $html = Get-Content -Raw -LiteralPath $path
  if ($html -notmatch 'href="assets/css/style.css"') {
    $failures.Add("$page does not load shared CSS")
  }
  if ($html -notmatch 'assets/js/script.js') {
    $failures.Add("$page does not load shared JS")
  }
  if ($html -match '—') {
    $failures.Add("$page contains an em dash")
  }
}

foreach ($file in $requiredFiles) {
  if (-not (Test-Path (Join-Path $root $file))) {
    $failures.Add("Missing required file: $file")
  }
}

$toolsHtml = Get-Content -Raw -LiteralPath (Join-Path $root "tools.html")
$requiredIds = @(
  "qr-input",
  "qr-generate",
  "qr-download",
  "qr-output",
  "finance-base",
  "finance-discount",
  "finance-tax",
  "finance-range",
  "finance-note",
  "finance-total",
  "finance-uppercase",
  "finance-budget",
  "finance-detail",
  "finance-save",
  "finance-clear",
  "finance-records"
)

foreach ($id in $requiredIds) {
  if ($toolsHtml -notmatch "id=`"$id`"") {
    $failures.Add("tools.html missing required id: $id")
  }
}

$indexHtml = Get-Content -Raw -LiteralPath (Join-Path $root "index.html")
foreach ($href in @("mailto:hello@cong.ltd", "https://t.me/JFNemo", "https://work.weixin.qq.com/?from=user_h5")) {
  if ($indexHtml -notlike "*$href*") {
    $failures.Add("index.html missing contact destination: $href")
  }
}

$css = Get-Content -Raw -LiteralPath (Join-Path $root "assets/css/style.css")
$bannedDominantColors = @("#281cff", "#6d3cff", "#020204", "#030308")
foreach ($color in $bannedDominantColors) {
  if ($css.ToLowerInvariant().Contains($color)) {
    $failures.Add("CSS still contains banned dominant color: $color")
  }
}

if ($failures.Count -gt 0) {
  Write-Host "Static site verification failed:" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Static site verification passed." -ForegroundColor Green
```

- [ ] **Step 2: Run verification to confirm current site fails**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected: FAIL because `assets/css/style.css` still contains the old dark purple dominant colors.

- [ ] **Step 3: Commit the verification guard**

Run:

```powershell
git add tools/verify-static-site.ps1
git commit -m "Add static site verification"
```

Expected: commit succeeds.

## Task 2: Light Airbnb-Style CSS System

**Files:**
- Modify: `assets/css/style.css`
- Test: `tools/verify-static-site.ps1`

- [ ] **Step 1: Replace global tokens**

Replace the existing `:root` block with light-theme tokens:

```css
:root {
  color-scheme: light;
  --bg: #f7f7f5;
  --surface: #ffffff;
  --surface-soft: #f1f1ee;
  --ink: #1f1f1f;
  --muted: #6f6f68;
  --line: rgba(31, 31, 31, .11);
  --accent: #ff385c;
  --accent-dark: #d91f48;
  --accent-soft: #fff0f3;
  --shadow-soft: 0 18px 45px rgba(31, 31, 31, .08);
  --shadow-card: 0 12px 30px rgba(31, 31, 31, .07);
  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-pill: 999px;
  --max: 1160px;
  --nav-h: 68px;
  --font-system: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif;
  --text-body: 16px;
  --text-lead: clamp(18px, 1.7vw, 22px);
  --text-card-title: clamp(22px, 2.2vw, 30px);
  --text-section-title: clamp(38px, 5vw, 64px);
  --text-hero: clamp(48px, 8vw, 94px);
}
```

- [ ] **Step 2: Rebuild base, navigation, buttons, sections, cards, forms, and responsive rules**

Update CSS so these selectors exist and use the new tokens:

```css
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-system);
  font-size: var(--text-body);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--nav-h);
  background: rgba(255, 255, 255, .86);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 22px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: var(--accent);
  color: #ffffff;
  font-weight: 650;
  line-height: 1;
  transition: transform .18s ease, background .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.btn:hover {
  transform: translateY(-1px);
  background: var(--accent-dark);
  box-shadow: 0 14px 26px rgba(255, 56, 92, .2);
}

.btn:active {
  transform: translateY(0);
}

.btn.secondary {
  background: #ffffff;
  color: var(--ink);
  border-color: var(--line);
  box-shadow: none;
}

.section {
  padding: clamp(72px, 9vw, 116px) 18px;
  background: var(--bg);
}

.card,
.studio-entry-card,
.tool-card,
.product-card,
.studio-proof div {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-card);
}
```

The final CSS must keep all selectors used by current HTML or newly planned HTML: `.skip-link`, `.nav`, `.nav-inner`, `.brand`, `.brand-mark`, `.nav-links`, `.nav-cta`, `.menu-btn`, `.mobile-menu`, `.hero`, `.studio-hero`, `.studio-hero-inner`, `.studio-hero-copy`, `.hero-kicker`, `.hero-subtitle`, `.hero-actions`, `.studio-signal`, `.signal-line`, `.section`, `.wrap`, `.section-head`, `.lead`, `.studio-statement`, `.studio-proof`, `.shelf-section`, `.shelf-head`, `.studio-entry-grid`, `.studio-entry-card`, `.contact`, `.contact-detail`, `.contact-icons`, `.footer`, `.page-hero`, `.tool-grid`, `.tool-card`, `.qr-app`, `.qr-output`, `.finance-app`, `.finance-result`, `.finance-records`, `.product-grid`, `.product-card`, `.product-media`, `.product-foot`, `.pill`, `.status-dot`, `.reveal`, and responsive media queries for `900px`, `760px`, and `560px`.

- [ ] **Step 3: Run static verification**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected after CSS replacement and before HTML rewrites: PASS for banned palette and required IDs.

- [ ] **Step 4: Commit CSS system**

Run:

```powershell
git add assets/css/style.css
git commit -m "Redesign shared CSS system"
```

Expected: commit succeeds.

## Task 3: Homepage Recomposition

**Files:**
- Modify: `index.html`
- Test: `tools/verify-static-site.ps1`

- [ ] **Step 1: Rewrite homepage main sections**

Keep the existing nav, mobile menu, contact destinations, footer, and script include. Replace the old dark hero and repeated cards with these section roles:

```html
<section class="hero studio-hero">
  <div class="wrap studio-hero-inner">
    <div class="studio-hero-copy">
      <p class="hero-kicker reveal">Cong.ltd studio</p>
      <h1 class="reveal">把常用入口整理得更安静。</h1>
      <p class="hero-subtitle reveal">一个轻量工作室首页，放下工具、闲置和联系入口，让访客快速找到下一步。</p>
      <div class="hero-actions reveal">
        <a class="btn" href="#contact">联系工作室</a>
        <a class="btn secondary" href="tools.html">打开工具</a>
      </div>
    </div>
    <figure class="hero-photo reveal">
      <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80" alt="明亮工作室中的桌面和电脑">
    </figure>
  </div>
</section>
```

Use three entry cards:

```html
<div class="studio-entry-grid">
  <a class="studio-entry-card reveal" href="tools.html">
    <span>工具</span>
    <strong>二维码和财务速算</strong>
    <p>把临时但常用的转换、计算和记录放在一个清楚位置。</p>
  </a>
  <a class="studio-entry-card reveal" href="preowned.html">
    <span>闲置</span>
    <strong>工作室二手物品</strong>
    <p>暂时不用的设备和办公物品，按清楚状态整理。</p>
  </a>
  <a class="studio-entry-card accent reveal" href="#contact">
    <span>联系</span>
    <strong>从邮件开始沟通</strong>
    <p>合作、咨询或确认一个想法是否值得继续，都可以先发邮件。</p>
  </a>
</div>
```

- [ ] **Step 2: Keep contact block destinations**

Verify the rewritten `index.html` still contains:

```html
href="mailto:hello@cong.ltd?subject=Cong.ltd%20%E8%81%94%E7%B3%BB"
href="https://t.me/JFNemo"
href="https://work.weixin.qq.com/?from=user_h5"
```

- [ ] **Step 3: Run static verification**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected: PASS.

- [ ] **Step 4: Commit homepage**

Run:

```powershell
git add index.html
git commit -m "Recompose homepage for Airbnb style"
```

Expected: commit succeeds.

## Task 4: Tools Page Recomposition

**Files:**
- Modify: `tools.html`
- Test: `tools/verify-static-site.ps1`

- [ ] **Step 1: Preserve JS hook IDs**

Before editing, confirm all required IDs are present:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected after Task 3: PASS.

- [ ] **Step 2: Rewrite tools page layout**

Keep every QR and finance ID listed in the design spec. Recompose the page with:

```html
<section class="section shelf-section page-hero tools-page">
  <div class="wrap">
    <div class="section-head left reveal">
      <p class="eyebrow dark-text">Studio tools</p>
      <h1>小工具</h1>
      <p class="lead">把二维码转换、金额大小写和报价速算放在一个清爽页面，打开就能用。</p>
    </div>
    <div class="tool-grid compact">
      <!-- QR tool article keeps qr-input, qr-generate, qr-download, qr-output. -->
      <!-- Finance tool article keeps all finance-* IDs. -->
    </div>
  </div>
</section>
```

Use real markup for the two articles and keep the current labels, buttons, and result containers so `assets/js/script.js` keeps working.

Replace the content inside `.tool-grid.compact` with this full structure:

```html
<article class="tool-card qr-tool reveal">
  <div class="tool-index">01</div>
  <div>
    <h3>二维码转换</h3>
    <p>输入链接、文字或联系方式，生成一张可下载的二维码图片。</p>
  </div>
  <div class="qr-app" aria-label="二维码转换工具">
    <label class="qr-label" for="qr-input">转换内容</label>
    <textarea id="qr-input" rows="4" placeholder="粘贴链接、文字、邮箱或其他内容"></textarea>
    <div class="qr-actions">
      <button class="btn" type="button" id="qr-generate">生成二维码</button>
      <a class="btn secondary disabled" id="qr-download" href="#" download="cong-qrcode.png" aria-disabled="true">下载图片</a>
    </div>
    <div class="qr-output" id="qr-output" aria-live="polite">
      <span>等待输入内容</span>
    </div>
  </div>
</article>

<article class="tool-card finance-tool reveal">
  <div class="tool-index">02</div>
  <div>
    <h3>财务速算</h3>
    <p>转换金额大写，快速记录报价、折扣、税费和预算区间。</p>
  </div>
  <div class="finance-app" aria-label="财务速算工具">
    <div class="finance-fields">
      <label>
        <span>报价金额</span>
        <input id="finance-base" type="number" min="0" step="0.01" value="12800" inputmode="decimal">
      </label>
      <label>
        <span>折扣</span>
        <input id="finance-discount" type="number" min="0" max="100" step="0.1" value="0" inputmode="decimal">
      </label>
      <label>
        <span>税率</span>
        <input id="finance-tax" type="number" min="0" max="100" step="0.1" value="6" inputmode="decimal">
      </label>
      <label>
        <span>预算浮动</span>
        <input id="finance-range" type="number" min="0" max="100" step="0.1" value="10" inputmode="decimal">
      </label>
    </div>
    <label class="finance-note">
      <span>记录备注</span>
      <input id="finance-note" type="text" maxlength="28" placeholder="例如：官网首页、设备采购、服务费">
    </label>
    <div class="finance-result" aria-live="polite">
      <div><span>应收合计</span><strong id="finance-total">¥0.00</strong></div>
      <div><span>金额大写</span><strong id="finance-uppercase">零元整</strong></div>
      <div><span>预算区间</span><strong id="finance-budget">¥0.00 - ¥0.00</strong></div>
      <div><span>折扣 / 税费</span><strong id="finance-detail">¥0.00 / ¥0.00</strong></div>
    </div>
    <div class="finance-actions">
      <button class="btn" type="button" id="finance-save">记录报价</button>
      <button class="btn secondary" type="button" id="finance-clear">清空记录</button>
    </div>
    <div class="finance-records" id="finance-records" aria-label="报价记录"></div>
  </div>
</article>
```

- [ ] **Step 3: Run static verification**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected: PASS.

- [ ] **Step 4: Commit tools page**

Run:

```powershell
git add tools.html
git commit -m "Recompose tools page"
```

Expected: commit succeeds.

## Task 5: Preowned Listing Recomposition

**Files:**
- Modify: `preowned.html`
- Test: `tools/verify-static-site.ps1`

- [ ] **Step 1: Add listing image areas**

Each product card should include a `.product-media` element before text:

```html
<div class="product-media">
  <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80" alt="银色笔记本电脑放在桌面上">
</div>
```

Use distinct images for the chair and monitor cards:

```html
<img src="https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80" alt="黑色办公椅">
<img src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80" alt="桌面上的显示器">
```

- [ ] **Step 2: Keep listing content and actions**

Keep the existing item names, descriptions, prices, condition labels, and these actions:

```html
<a class="btn" href="mailto:hello@cong.ltd?subject=Cong.ltd%20%E9%97%B2%E7%BD%AE">问问物品</a>
<a class="btn secondary" href="index.html#contact">回到主页</a>
```

- [ ] **Step 3: Run static verification**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected: PASS.

- [ ] **Step 4: Commit preowned page**

Run:

```powershell
git add preowned.html
git commit -m "Recompose preowned listings"
```

Expected: commit succeeds.

## Task 6: Browser Verification and Final Polish

**Files:**
- Modify if necessary: `assets/css/style.css`
- Modify if necessary: `assets/js/script.js`
- Test: local browser preview

- [ ] **Step 1: Start a static server**

Run:

```powershell
python -m http.server 8000
```

Expected: server listens at `http://127.0.0.1:8000/`.

- [ ] **Step 2: Verify key flows manually**

Open:

```text
http://127.0.0.1:8000/index.html
http://127.0.0.1:8000/tools.html
http://127.0.0.1:8000/preowned.html
```

Check:

- Desktop navigation fits on one line.
- Mobile menu opens and closes.
- Homepage CTA links work.
- QR code renders from the default `https://cong.ltd` value.
- QR download button becomes enabled after generation.
- Finance total updates when amount, discount, tax, or range changes.
- Finance save creates a record.
- Finance clear removes records.
- Preowned contact button opens the mail link.

- [ ] **Step 3: Run final static verification**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-static-site.ps1
```

Expected: PASS with `Static site verification passed.`

- [ ] **Step 4: Inspect git status**

Run:

```powershell
git status --short
```

Expected: only intentional final polish files are modified, or the working tree is clean after commits.

- [ ] **Step 5: Commit final polish**

If final polish changed files, run:

```powershell
git add assets/css/style.css assets/js/script.js index.html tools.html preowned.html
git commit -m "Polish Airbnb redesign"
```

Expected: commit succeeds when there are final polish changes.

## Self-Review

Spec coverage:

- Three pages covered by Tasks 3, 4, and 5.
- Light Airbnb-style visual system covered by Task 2.
- QR and finance behavior protected by Task 1 and Task 4.
- Contact destinations protected by Task 1 and Task 3.
- Browser and mobile checks covered by Task 6.

Red flag scan:

- No unfinished markers are used.
- Required JS IDs are explicitly listed.
- Exact commands and expected outcomes are included.
- The plan keeps the static architecture and does not add a framework.
