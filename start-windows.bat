@echo off
title Los Santos Radio
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening the download page...
  echo Install the LTS version, then double-click this file again.
  start "" https://nodejs.org/en/download
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing, this only happens the first time...
  call npm install --no-audit --no-fund || goto :fail
)

if not exist .env.local (
  call npm run setup || goto :fail
)

if not exist .next\BUILD_ID (
  echo Building the app, this only happens the first time...
  call npm run build || goto :fail
)

echo.
echo Los Santos Radio is running at http://127.0.0.1:3000
echo Close this window to stop it.
start "" cmd /c "timeout /t 3 >nul & start http://127.0.0.1:3000"
call npm run start:local
goto :eof

:fail
echo.
echo Something went wrong. See the messages above.
pause
exit /b 1
