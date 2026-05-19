@echo off
echo ==================================================
echo     Indoor Navigation System - Build ^& Integrate
echo ==================================================

echo.
echo [1/3] Building React Frontend...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [2/3] Copying Frontend Build to Spring Boot Backend...
if not exist "backend\src\main\resources\static" mkdir "backend\src\main\resources\static"
xcopy /E /I /Y "frontend\dist\*" "backend\src\main\resources\static\"

echo.
echo [3/3] Frontend Integrated Successfully! 
echo You can now run the backend Spring Boot app. The frontend will be served at http://localhost:8080/
echo.
pause
