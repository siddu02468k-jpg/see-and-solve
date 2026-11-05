@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo   SEE ^& SOLVE - INSTANT PUBLIC CLOUDFLARE HTTPS TUNNEL
echo ===================================================================
echo   Generating a secure public HTTPS URL for mobile access...
echo ===================================================================

set "CF_EXE=cloudflared"
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
        set "CF_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
    ) else if exist "%LOCALAPPDATA%\cloudflared\cloudflared.exe" (
        set "CF_EXE=%LOCALAPPDATA%\cloudflared\cloudflared.exe"
    )
)

echo.
echo Launching tunnel to http://localhost:5050 ...
echo Look for the link ending in .trycloudflare.com below!
echo Open that link in your phone's browser (Chrome, Safari, etc.)
echo.

"%CF_EXE%" tunnel --url http://localhost:5050

pause
