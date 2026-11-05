@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo   SEE ^& SOLVE - RUNNING ALL 13 ACCEPTANCE TESTS
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
        pause
        exit /b 1
    )
)

"%NODE_EXE%" tests\acceptance.test.js

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Tests failed with exit code %ERRORLEVEL%
    pause
) else (
    echo [SUCCESS] All acceptance tests executed and passed.
)
