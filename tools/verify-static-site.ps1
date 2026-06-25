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
}

if ($failures.Count -gt 0) {
    Write-Host "Static site verification failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host " - $failure"
    }
    exit 1
}

Write-Host "Static site verification passed." -ForegroundColor Green
