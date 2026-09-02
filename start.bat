@echo off
echo ========================================
echo Starting School Management System
echo ========================================

echo [1/4] Starting MySQL...
start "MySQL" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld" --console
timeout /t 5 /nobreak > nul

echo [2/4] Starting Backend...
start "Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo [3/4] Starting Frontend...
timeout /t 3 /nobreak > nul
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Default Login:
echo Username: admin
echo Password: admin123
echo.
echo ========================================
echo Press any key to close this window...
pause > nul