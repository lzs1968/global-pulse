# Global Pulse local preview server (no Python required)
$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$root = [IO.Path]::GetFullPath($root).TrimEnd('\')
Set-Location -LiteralPath $root

. (Join-Path $root "vote-server.ps1") -Root $root

function Test-PortFree([int]$port) {
  try {
    $used = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($used) { return $false }
    return $true
  } catch {
    $probe = $null
    try {
      $probe = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
      $probe.Start()
      $probe.Stop()
      return $true
    } catch {
      return $false
    } finally {
      if ($probe) { try { $probe.Stop() } catch {} }
    }
  }
}

function Find-FreePort([int]$start = 8888) {
  for ($p = $start; $p -lt ($start + 50); $p++) {
    if (Test-PortFree $p) { return $p }
  }
  throw "No free TCP port found between $start and $($start + 49)"
}

function Get-MimeType([string]$path) {
  switch -Regex ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    "\.html?" { return "text/html; charset=utf-8" }
    "\.css"   { return "text/css; charset=utf-8" }
    "\.js"    { return "application/javascript; charset=utf-8" }
    "\.json"  { return "application/json; charset=utf-8" }
    "\.svg"   { return "image/svg+xml" }
    "\.png"   { return "image/png" }
    "\.jpg"   { return "image/jpeg" }
    default   { return "application/octet-stream" }
  }
}

function Send-File([System.Net.HttpListenerResponse]$res, [string]$filePath) {
  $bytes = [IO.File]::ReadAllBytes($filePath)
  $res.ContentType = Get-MimeType $filePath
  $res.ContentLength64 = $bytes.Length
  $res.StatusCode = 200
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

$port = Find-FreePort 8888
$prefix = "http://127.0.0.1:$port/"
$homeUrl = "${prefix}index.html"

Write-Host ""
Write-Host " ========================================" -ForegroundColor Cyan
Write-Host "  Global Pulse Preview Server" -ForegroundColor Cyan
Write-Host " ========================================" -ForegroundColor Cyan
Write-Host " Folder: $root"
Write-Host ""
Write-Host " >>> OPEN IN BROWSER (Chrome / Edge):" -ForegroundColor Green
Write-Host " $homeUrl" -ForegroundColor White
Write-Host ""
Write-Host " Map:    ${prefix}map.html"
Write-Host ""
Write-Host " Keep this window open. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host " Do NOT double-click index.html — use the URL above." -ForegroundColor Yellow
Write-Host ""

$urlFile = Join-Path $root "preview-url.txt"
Set-Content -Path $urlFile -Value $homeUrl -Encoding UTF8 -NoNewline
Add-Content -Path $urlFile -Value "" -Encoding UTF8
Write-Host " URL saved to: preview-url.txt" -ForegroundColor Gray
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "ERROR: Cannot start HTTP listener." -ForegroundColor Red
  Write-Host $_.Exception.Message
  Write-Host ""
  Write-Host "Try: Right-click START.bat -> Run as administrator"
  Read-Host "Press Enter to exit"
  exit 1
}

function Open-PreviewBrowser([string]$url) {
  try {
    Start-Process $url | Out-Null
    return
  } catch {}
  try {
    Start-Process "cmd.exe" -ArgumentList "/c", "start", "", $url | Out-Null
    return
  } catch {}
  Write-Host " Could not auto-open browser. Copy the URL above manually." -ForegroundColor Red
}

Open-PreviewBrowser $homeUrl

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $res.Headers.Add("Cache-Control", "no-cache")

    try {
      $rel = [Uri]::UnescapeDataString($req.Url.LocalPath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }

      if (Invoke-VoteApi $req $res) {
        continue
      }

      $candidate = Join-Path $root $rel
      $full = [IO.Path]::GetFullPath($candidate)

      if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
        $res.StatusCode = 403
        $buf = [Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        $res.OutputStream.Write($buf, 0, $buf.Length)
      }
      elseif ([IO.Directory]::Exists($full)) {
        $full = Join-Path $full "index.html"
        if ([IO.File]::Exists($full)) { Send-File $res $full } else { throw "Not found" }
      }
      elseif ([IO.File]::Exists($full)) {
        Send-File $res $full
      }
      else {
        $res.StatusCode = 404
        $buf = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $res.ContentType = "text/plain; charset=utf-8"
        $res.OutputStream.Write($buf, 0, $buf.Length)
      }
    } catch {
      $res.StatusCode = 500
      $buf = [Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
