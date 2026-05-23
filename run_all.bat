@echo off

rem Change to the project root directory
cd /d "%~dp0"

echo Starting backend on port 8080...
start "Backend" cmd /c "cd backend && mvn spring-boot:run"

echo Starting frontend (Vite dev server)...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo Both services are running. Press any key to close this window.
pause >nul
