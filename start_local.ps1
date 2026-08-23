$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Test-Listening($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  $bundled = "C:\Users\20549\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (Test-Path $bundled) { $node = $bundled }
}
if (-not $node) { throw "node.exe was not found." }

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { throw "python.exe was not found." }

if (-not (Test-Listening 8787)) {
  Start-Process -FilePath $node -ArgumentList "backend/server.mjs" -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Milliseconds 800
}
if (-not (Test-Listening 8080)) {
  Start-Process -FilePath $python -ArgumentList @("-m", "http.server", "8080", "--directory", "web") -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Milliseconds 500
}

Write-Host "Yingge H5:       http://127.0.0.1:8080/"
Write-Host "Admin console:   http://127.0.0.1:8080/admin.html"
Write-Host "Review center:   http://127.0.0.1:8080/review.html"
Write-Host "API health:      http://127.0.0.1:8787/api/health"
