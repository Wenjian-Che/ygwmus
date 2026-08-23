param([switch]$Production)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root "backend\.env"
$checks = @()

function Add-Check($name, $ok, $detail) { $script:checks += [pscustomobject]@{ name=$name; ok=[bool]$ok; detail=$detail } }

Add-Check "backend_env" (Test-Path $envFile) "backend/.env exists"
if (Test-Path $envFile) {
  $envText = Get-Content $envFile -Raw
  $keyConfigured = $envText -match '(?m)^\s*DEEPSEEK_API_KEY\s*=\s*\S+'
  $adminConfigured = $envText -match '(?m)^\s*ADMIN_TOKEN\s*=\s*\S+'
  Add-Check "deepseek_key" $keyConfigured "Key is present without printing its value"
  Add-Check "admin_token" ($adminConfigured -or -not $Production) ($(if($adminConfigured){"Token configured"}elseif($Production){"Required in production"}else{"Local mode: optional"}))
}
Add-Check "sqlite" (Test-Path (Join-Path $root "backend\yingge.sqlite")) "backend/yingge.sqlite exists"
Add-Check "web_entry" (Test-Path (Join-Path $root "web\index.html")) "web/index.html exists"

try {
  $health = (New-Object System.Net.WebClient).DownloadString("http://127.0.0.1:8787/api/health") | ConvertFrom-Json
  Add-Check "api_health" ($health.ok -eq $true) "model=$($health.model); storage=$($health.storage)"
} catch { Add-Check "api_health" $false "Start backend/server.mjs first" }

$failed = @($checks | Where-Object { -not $_.ok }).Count
$checks | ConvertTo-Json -Depth 4
if ($failed -gt 0) { exit 1 }
