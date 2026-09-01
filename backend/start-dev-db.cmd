@echo off
echo Starting Ledgera PostgreSQL Database for Development...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Stopping any existing containers...
docker-compose -f docker-compose.dev.yml down

echo Starting PostgreSQL container...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Check if container is running
docker ps | findstr "ledgera-postgres-dev" >nul
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo PostgreSQL is running successfully!
    echo ========================================
    echo.
    echo Connection Details:
    echo   Host: localhost
    echo   Port: 5432
    echo   Database: ledgera
    echo   Username: ledgera
    echo   Password: ledgera123
    echo.
    echo Connection String:
    echo   jdbc:postgresql://localhost:5432/ledgera
    echo.
    echo To view logs: docker logs ledgera-postgres-dev -f
    echo To stop: docker-compose -f docker-compose.dev.yml down
    echo ========================================
) else (
    echo.
    echo ERROR: Failed to start PostgreSQL container!
    echo Check Docker logs: docker logs ledgera-postgres-dev
)

echo.
pause
