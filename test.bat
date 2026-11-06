@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo   SEE ^& SOLVE - RUNNING ACCEPTANCE ^& SECURITY TEST SUITES
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

echo [1/2] Running 14 Functional Acceptance Scenarios...
"%NODE_EXE%" tests\acceptance.test.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Acceptance tests failed with exit code %ERRORLEVEL%
    pause
    exit /b 1
)

echo.
echo [2/2] Running Comprehensive Security Audit Suite...
"%NODE_EXE%" tests\security.test.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Security audit failed with exit code %ERRORLEVEL%
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All functional and security tests passed with 100% compliance.
