[CmdletBinding()]
param(
    [string]$UnityEditorPath = ""
)

$ErrorActionPreference = "Stop"
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$versionFile = Join-Path $projectPath "ProjectSettings/ProjectVersion.txt"

if (-not (Test-Path $versionFile)) {
    throw "Cannot find ProjectSettings/ProjectVersion.txt at $projectPath"
}

$versionLine = Get-Content $versionFile | Where-Object { $_ -match '^m_EditorVersion:\s*(.+)$' } | Select-Object -First 1
if (-not $versionLine) {
    throw "Could not read m_EditorVersion from $versionFile"
}
$editorVersion = ($versionLine -replace '^m_EditorVersion:\s*', '').Trim()

if ([string]::IsNullOrWhiteSpace($UnityEditorPath)) {
    $candidate = Join-Path $env:ProgramFiles "Unity/Hub/Editor/$editorVersion/Editor/Unity.exe"
    if (Test-Path $candidate) {
        $UnityEditorPath = $candidate
    } else {
        throw @"
Unity Editor $editorVersion was not found at:
  $candidate

Install the project's version through Unity Hub, or pass the full path:
  .\tools\run-unity-editmode.ps1 -UnityEditorPath "C:\Path\To\Unity.exe"

The repository targets $editorVersion. A newer editor may upgrade project files; avoid upgrading unless you intend to test that migration.
"@
    }
}

if (-not (Test-Path $UnityEditorPath -PathType Leaf)) {
    throw "Unity Editor executable not found: $UnityEditorPath"
}

$resultsDir = Join-Path $projectPath "TestResults"
$logsDir = Join-Path $projectPath "Logs"
New-Item -ItemType Directory -Force -Path $resultsDir, $logsDir | Out-Null
$resultsPath = Join-Path $resultsDir "EditMode.xml"
$logPath = Join-Path $logsDir "EditMode.log"

Write-Host "Project: $projectPath"
Write-Host "Unity version expected: $editorVersion"
Write-Host "Editor: $UnityEditorPath"
Write-Host "Running EditMode tests..."

$unityArgs = @(
    "-batchmode",
    "-nographics",
    "-projectPath", $projectPath,
    "-runTests",
    "-testPlatform", "EditMode",
    "-testResults", $resultsPath,
    "-logFile", $logPath
)
& $UnityEditorPath @unityArgs

$unityExitCode = $LASTEXITCODE
if ($unityExitCode -ne 0) {
    Write-Error "Unity EditMode tests failed (exit code $unityExitCode). Review $logPath and $resultsPath."
    exit $unityExitCode
}

if (-not (Test-Path $resultsPath -PathType Leaf)) {
    Write-Error "Unity exited without writing test results. Review $logPath."
    exit 1
}

Write-Host "EditMode tests completed. Results: $resultsPath"
Write-Host "Unity log: $logPath"
exit 0
