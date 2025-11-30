@echo off
REM Cafe POS System - Start Script for Windows
REM Usage: start.bat or start.bat up

setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   ☕ Cafe POS System - Docker Runner ☕       ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

echo ✓ Docker found
echo.

REM Determine the command
set COMMAND=%1
if "!COMMAND!"=="" set COMMAND=up

if "!COMMAND!"=="up" (
    echo 🚀 Starting Cafe POS System...
    echo.
    docker-compose up --build
) else if "!COMMAND!"=="down" (
    echo ⛔ Stopping Cafe POS System...
    docker-compose down
    echo ✓ Stopped
) else if "!COMMAND!"=="restart" (
    echo 🔄 Restarting Cafe POS System...
    docker-compose restart
    echo ✓ Restarted
) else if "!COMMAND!"=="logs" (
    echo 📋 Showing logs...
    docker-compose logs -f
) else if "!COMMAND!"=="shell" (
    echo 🔧 Opening shell...
    docker-compose exec cafe-pos bash
) else if "!COMMAND!"=="clean" (
    echo 🧹 Cleaning up...
    docker-compose down -v
    echo ✓ Cleaned
) else (
    echo Usage: start.bat [command]
    echo.
    echo Commands:
    echo   up        - Start the system (default^)
    echo   down      - Stop the system
    echo   restart   - Restart the system
    echo   logs      - Show logs
    echo   shell     - Open shell in container
    echo   clean     - Remove containers and volumes
)
