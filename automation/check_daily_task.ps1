$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$checks = @()

function Add-Check($name, $pass, $detail) { $script:checks += [pscustomobject]@{ name = $name; pass = [bool]$pass; detail = $detail } }

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
$nodeDetail = if ($node) { $node } else { "node.exe not found" }
Add-Check "node" ([bool]$node) $nodeDetail
Add-Check "daily_refresh" (Test-Path (Join-Path $PSScriptRoot "daily_refresh.mjs")) "automation/daily_refresh.mjs"
Add-Check "quality_regression" (Test-Path (Join-Path $PSScriptRoot "quality_regression.mjs")) "automation/quality_regression.mjs"
Add-Check "question_cluster" (Test-Path (Join-Path $PSScriptRoot "question_cluster.mjs")) "automation/question_cluster.mjs"
Add-Check "output_dir" (Test-Path (Join-Path $root "agent/generated")) "agent/generated"

try {
  $health = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8787/api/health" -TimeoutSec 5
  Add-Check "agent_api" ($health.StatusCode -eq 200) "http://127.0.0.1:8787/api/health"
} catch { Add-Check "agent_api" $false "backend/server.mjs is not reachable" }

$taskOutput = & schtasks.exe /Query /TN "Yingge Daily Knowledge Refresh" /FO LIST 2>$null
$taskFound = ($LASTEXITCODE -eq 0 -and [bool]$taskOutput)
Add-Check "scheduled_task" $taskFound ($(if ($taskFound) { "registered" } else { "not registered; run register_daily_task.ps1" }))

$result = [pscustomobject]@{ ready = [bool]($checks | Where-Object { -not $_.pass } | Measure-Object).Count -eq 0; checks = $checks; generated_at = (Get-Date).ToUniversalTime().ToString("o") }
$result | ConvertTo-Json -Depth 4
if (-not $result.ready) { exit 1 }
