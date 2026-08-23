$ErrorActionPreference = "Stop"

# Daily candidate refresh plus a lightweight quality regression.
$root = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "node.exe not found. Install Node.js or add it to PATH." }

Set-Location $root
& $node "automation/daily_refresh.mjs"
if ($LASTEXITCODE -ne 0) { throw "daily_refresh.mjs failed with exit code $LASTEXITCODE" }

# Retrieval checks are free. Model answer QA is opt-in via YINGGE_RUN_MODEL_QA=1.
& $node "automation/quality_regression.mjs"
if ($LASTEXITCODE -ne 0) { Write-Warning "quality_regression.mjs failed; refresh data is still available." }

# Merge semantically similar real-user questions into a prioritized review report.
& $node "automation/question_cluster.mjs"
if ($LASTEXITCODE -ne 0) { Write-Warning "question_cluster.mjs failed; feedback records remain available." }
