@echo off
echo 🧠 MindMate - Voice-First Mental Wellness PWA
echo ============================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found. Please run this from the MindMate root directory.
    pause
    exit /b 1
)

echo 🚀 Starting MindMate services...
echo.

REM Copy environment file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ Created .env file from .env.example
    ) else (
        echo ⚠️  No .env.example found, using default environment
    )
)

REM Start services
docker-compose up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo.
echo ✅ MindMate services are starting up...
echo.
echo ⏳ Waiting for services to be ready...

REM Wait for services to be healthy
timeout /t 10 /nobreak >nul

echo.
echo 🌟 MindMate is ready!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo 🗄️  Database: localhost:5432 (postgres/postgres)
echo 📦 Storage: http://localhost:9001 (admin/password123)
echo.
echo 🎯 Quick Start:
echo 1. Open http://localhost:3000 in your browser
echo 2. Click "Start Voice Check-in with Hrudhi"
echo 3. Allow microphone permissions
echo 4. Talk for 30-40 seconds about your day
echo 5. Experience emotion detection and friend matching!
echo.
echo 🧪 Test Commands:
echo • Test friend matching: bash demo/test-friend-matching.sh
echo • Full integration test: bash demo/integration-test.sh
echo • View logs: docker-compose logs -f
echo • Stop services: docker-compose down
echo.
echo 🌐 Opening MindMate in your browser...

REM Try to open in default browser
start http://localhost:3000

echo.
echo ✨ Enjoy your journey with MindMate!
echo Press any key to exit...
pause >nul