$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$failures = @()

function Test-FileExists {
    param(
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        $script:failures += "Missing file: $($Path.Substring($root.Length + 1))"
    }
}

function Get-RequiredContent {
    param(
        [string]$Path
    )

    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        return Get-Content -LiteralPath $Path -Raw
    }

    return $null
}

$pages = @("index.html", "tools.html", "preowned.html")

foreach ($page in $pages) {
    $path = Join-Path $root $page
    Test-FileExists -Path $path
}

$cssPath = Join-Path $root "assets/css/style.css"
$jsPath = Join-Path $root "assets/js/script.js"
Test-FileExists -Path $cssPath
Test-FileExists -Path $jsPath

$requiredMediaFiles = @(
    "assets/img/studio-hero.jpg",
    "assets/img/macbook-pro-14.jpg",
    "assets/img/ergonomic-chair.jpg",
    "assets/img/monitor-27.jpg",
    "assets/icons/email.png",
    "assets/icons/telegram.png",
    "assets/icons/wechat.png"
)

foreach ($mediaFile in $requiredMediaFiles) {
    Test-FileExists -Path (Join-Path $root $mediaFile)
}

$emDash = [char]0x2014

foreach ($page in $pages) {
    $path = Join-Path $root $page
    $content = Get-RequiredContent -Path $path

    if ($null -eq $content) {
        continue
    }

    if (-not $content.Contains('href="assets/css/style.css"')) {
        $failures += "$page does not load assets/css/style.css"
    }

    if (-not $content.Contains('assets/js/script.js')) {
        $failures += "$page does not load assets/js/script.js"
    }

    if ($content.Contains($emDash)) {
        $failures += "$page contains an em dash"
    }

    $externalVisualHosts = @(
        "images.unsplash.com",
        "pub-fa66d36fcbec41acb00d20a64ab77dc9.r2.dev"
    )

    foreach ($visualHost in $externalVisualHosts) {
        if ($content.Contains($visualHost)) {
            $failures += "$page still depends on external visual host: $visualHost"
        }
    }
}

$toolsPath = Join-Path $root "tools.html"
$toolsContent = Get-RequiredContent -Path $toolsPath

if ($null -ne $toolsContent) {
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
        if ($toolsContent -notmatch "id\s*=\s*['""]$([regex]::Escape($id))['""]") {
            $failures += "tools.html missing id: $id"
        }
    }
}

$indexPath = Join-Path $root "index.html"
$indexContent = Get-RequiredContent -Path $indexPath

if ($null -ne $indexContent) {
    $contactDestinations = @(
        "mailto:hello@cong.ltd",
        "https://t.me/JFNemo",
        "https://work.weixin.qq.com/?from=user_h5"
    )

    foreach ($destination in $contactDestinations) {
        if (-not $indexContent.Contains($destination)) {
            $failures += "index.html missing contact destination: $destination"
        }
    }
}

$cssContent = Get-RequiredContent -Path $cssPath

if ($null -ne $cssContent) {
    $bannedColors = @("#281cff", "#6d3cff", "#020204", "#030308")

    foreach ($color in $bannedColors) {
        if ($cssContent -match [regex]::Escape($color)) {
            $failures += "assets/css/style.css contains banned dominant color: $color"
        }
    }

    if ($cssContent -notmatch "(?s)\.nav\s*\{[^}]*position:\s*fixed;") {
        $failures += "assets/css/style.css must keep the top nav fixed"
    }

    if ($cssContent -notmatch "(?s)\.nav\s*\{[^}]*backdrop-filter:\s*blur\(") {
        $failures += "assets/css/style.css must give the top nav a glass blur"
    }

    if ($cssContent -match "(?s)\.nav-links\s*\{[^}]*font-size:\s*var\(--text-caption\)") {
        $failures += "assets/css/style.css nav links are still using caption-size text"
    }

    if ($cssContent -notmatch "(?s)@media\s*\(max-width:\s*560px\)\s*\{.*?\.hero,\s*\.studio-hero\s*\{[^}]*min-height:\s*auto;") {
        $failures += "assets/css/style.css must remove full viewport hero height on small screens"
    }

    if ($cssContent -notmatch "(?s)@media\s*\(max-width:\s*560px\)\s*\{.*?\.hero h1,\s*\.studio-hero h1\s*\{[^}]*font-size:\s*clamp\(39px,\s*10\.8vw,\s*46px\);") {
        $failures += "assets/css/style.css must keep mobile hero titles within a 390px viewport"
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Static site verification failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host " - $failure"
    }
    exit 1
}

Write-Host "Static site verification passed." -ForegroundColor Green
