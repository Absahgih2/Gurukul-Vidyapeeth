@echo off
title GVU Server - Enable Auto-Start on System Boot
set SCRIPT_DIR=%~dp0
set TARGET=%SCRIPT_DIR%start-server-hidden.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP_DIR%\GVU-Backend-Server.lnk

echo Setting up Auto-Start on system boot...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"

echo.
echo ======================================================================
echo  [SUCCESS] Auto-Start Enabled!
echo  The GVU Backend Server will now start automatically whenever your
echo  computer boots up.
echo ======================================================================
echo.
pause
