@echo off
echo ========================================
echo Neon Database Keep-Alive Script
echo ========================================
echo This script pings your backend every 4 minutes
echo to keep the Neon database from sleeping.
echo.
echo Leave this window open while developing!
echo Press Ctrl+C to stop.
echo ========================================
echo.

:loop
echo [%date% %time%] Pinging backend to keep database awake...
curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [%date% %time%] ✓ Backend is responding
) else (
    echo [%date% %time%] ✗ Backend not responding - is it running?
)
echo Waiting 4 minutes until next ping...
echo.
timeout /t 240 /nobreak >nul
goto loop
