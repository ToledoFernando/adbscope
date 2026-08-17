# Builds the app with `wails build`. Packaging scrcpy/ (adb.exe,
# scrcpy.exe, and their DLLs) alongside the built executable now happens
# automatically as part of that (see wails.json's frontend:build hook /
# scripts/copy-scrcpy.mjs) — `wails build` alone is enough. This script
# is kept as a convenience alias; the copy below is a harmless no-op re-run.
$ErrorActionPreference = "Stop"

wails build @args

$binDir = Join-Path $PSScriptRoot "..\build\bin"
$scrcpySrc = Join-Path $PSScriptRoot "..\scrcpy"
$scrcpyDest = Join-Path $binDir "scrcpy"

Copy-Item -Path $scrcpySrc -Destination $scrcpyDest -Recurse -Force
Write-Host "Copied scrcpy/ to $scrcpyDest"
