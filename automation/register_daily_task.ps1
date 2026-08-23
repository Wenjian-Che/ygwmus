$ErrorActionPreference = "Stop"

$taskName = "Yingge Daily Knowledge Refresh"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot "run_daily_refresh.ps1"
$powershell = (Get-Command powershell.exe).Source

if (-not (Test-Path $runner)) {
  throw "Runner script not found: $runner"
}

$action = New-ScheduledTaskAction -Execute $powershell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`""
$trigger = New-ScheduledTaskTrigger -Daily -At 7:00am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Fetch Yingge dynamic knowledge candidates for review." -Force | Out-Null
Write-Host "Scheduled task installed: $taskName"
Write-Host "Runs daily at 07:00 and writes candidates to automation/inbox."
