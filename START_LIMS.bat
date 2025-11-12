@echo off
echo ========================================
echo   Life360Omics LIMS Startup
echo ========================================
echo.

echo Starting Backend API...
start "Life360Omics Backend" cmd /c "cd backend\LimsApi && dotnet run"

timeout /t 10

echo.
echo Starting Frontend...
start "Life360Omics Frontend" cmd /c "npm run dev"

echo.
echo ========================================
echo   Life360Omics LIMS is starting!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo Frontend UI: http://localhost:3000
echo.
echo Login with:
echo   Email: admin@life360omics.com
echo   Password: Admin123!
echo.
echo Press any key to close this window...
pause >nul


