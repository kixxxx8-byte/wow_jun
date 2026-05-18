$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $root ".tools\node-v24.14.0-win-x64"
$npm = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path $npm)) {
  throw "Portable npm not found at $npm"
}

$env:Path = "$nodeDir;$env:Path"
Set-Location $root
& $npm run firebase:login
