@echo off
title GVU Server - Disable Auto-Start on System Boot
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP_DIR%\GVU-Backend-Server.lnk

echo Disabling Auto-Start on system boot...
if exist "%SHORTCUT%" (
    del "%SHORTCUT%"
    echo.
    echo ======================================================================
    echo  [SUCCESS] Auto-Start has been disabled and removed.
    echo ======================================================================
) else (
    echo.
    echo Auto-Start was not configured or already removed.
)
echo.
pause
