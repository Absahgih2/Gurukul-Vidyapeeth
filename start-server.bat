@echo off
title Gurukul Vidyapeeth University Server
echo ======================================================================
echo           Gurukul Vidyapeeth University - Server Launcher
echo ======================================================================
echo.
cd /d "%~dp0admin-panel"

echo Checking Node.js installation...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Node.js backend server on http://localhost:5000 ...
echo - Website:     http://localhost:5000/
echo - Admin Panel: http://localhost:5000/admin/
echo - API:         http://localhost:5000/api/db
echo.
echo (Keep this window open while using the website)
echo ======================================================================
echo.

node server.js
pause
