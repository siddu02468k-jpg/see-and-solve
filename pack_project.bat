@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo   SEE ^& SOLVE - PACK PROJECT FOR CLOUD HOSTING
echo ===================================================================
echo   Creating see-and-solve-pro.zip for direct upload...
echo ===================================================================

set "ZIP_FILE=%~dp0see-and-solve-pro.zip"

if exist "%ZIP_FILE%" del "%ZIP_FILE%"

powershell -Command "Compress-Archive -Path '%~dp0data', '%~dp0public', '%~dp0server', '%~dp0Dockerfile', '%~dp0docker-compose.yml', '%~dp0package.json', '%~dp0render.yaml', '%~dp0README.md' -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo.
    echo [SUCCESS] Created: %ZIP_FILE%
    echo You can now upload this ZIP file directly to GitHub or your cloud host!
    echo.
) else (
    echo [ERROR] Failed to create ZIP file.
)

pause
