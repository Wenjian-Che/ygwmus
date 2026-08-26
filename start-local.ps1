$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Test-Listening([int]$port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "未找到 Node.js 18+。" }

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { throw "未找到 Python 3。" }

if (-not (Test-Path "$root\backend\.env")) {
  Write-Warning "backend/.env 不存在。智能体可启动，但没有模型密钥时只能使用本地知识回退。"
}

if (-not (Test-Listening 8787)) {
  Start-Process -FilePath $node -ArgumentList "backend/server.mjs" -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Milliseconds 900
}

if (-not (Test-Listening 8096)) {
  Start-Process -FilePath $python -ArgumentList @("-m", "http.server", "8096", "--bind", "127.0.0.1", "--directory", "web") -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Milliseconds 600
}

Write-Host "Museum: http://127.0.0.1:8096/"
Write-Host "Agent:  http://127.0.0.1:8787/api/health"

