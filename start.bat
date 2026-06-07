@echo off
echo Starting LinkSports...
echo.

echo [1/2] Starting Backend (port 5000)...
start "LinkSports Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (port 3000)...
start "LinkSports Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ LinkSports is starting!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000/api/v1/health
echo.
echo Both windows will open separately. Keep them running.
pause
