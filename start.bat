@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo   SEE ^& SOLVE - PRODUCTION-READY APPLICATION SERVER
echo ===================================================================

:: Ensure Node is available
set "NODE_EXE=node"
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "%APPDATA%\Antigravity\bin\node.cmd" (
        set "NODE_EXE=%APPDATA%\Antigravity\bin\node.cmd"
    ) else if exist "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" (
        set "ELECTRON_RUN_AS_NODE=1"
        set "NODE_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
    ) else (
        echo [ERROR] Node runtime could not be located.
        echo Please ensure Antigravity or Node.js is installed.
        pause
        exit /b 1
    )
)

echo [INFO] Starting See ^& Solve Server on http://localhost:5050 ...
echo [INFO] Opening web browser at http://localhost:5050 ...

start "" "http://localhost:5050"

"%NODE_EXE%" server\index.js

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server terminated with error code %ERRORLEVEL%
    pause
)
