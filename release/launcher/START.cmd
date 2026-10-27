@echo off
setlocal
cd /d "%~dp0"
if not exist "runtime\node.exe" (
  echo Missing runtime. Extract the ENTIRE ZIP file before starting.
  pause
  exit /b 1
)
"runtime\node.exe" "server.mjs"
if errorlevel 1 pause
