$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "backups"
$target = Join-Path $backupRoot $stamp
New-Item -ItemType Directory -Path $target -Force | Out-Null

$files = @(
  "backend\yingge.sqlite",
  "backend\apps.json",
  "web\data\source_registry.json",
  "agent\knowledge_manifest.json",
  "automation\seen.json"
)
foreach ($relative in $files) {
  $source = Join-Path $root $relative
  if (Test-Path $source) {
    $destination = Join-Path $target $relative
    New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force
  }
}

$inbox = Join-Path $root "automation\inbox"
if (Test-Path $inbox) { Copy-Item -LiteralPath $inbox -Destination (Join-Path $target "automation\inbox") -Recurse -Force }

Write-Host "Backup created: $target"
Write-Host "Secrets excluded: backend/.env"
