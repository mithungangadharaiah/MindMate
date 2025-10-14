@echo off
echo.
echo 🧠 MindMate - Windows Native Setup
echo ==================================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install Node.js with npm.
    pause
    exit /b 1
)

echo ✅ Node.js and npm found

REM Setup environment
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. You can edit it for production settings.
)

REM Install backend dependencies
echo.
echo 🔧 Installing backend dependencies...
cd backend
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Backend npm install failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies already installed
)

REM Install frontend dependencies
echo.
echo 🎨 Installing frontend dependencies...
cd ..\frontend
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Frontend npm install failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed
)

cd ..

REM Start services
echo.
echo 🚀 Starting MindMate services...
echo.
echo Starting backend server (port 5000)...
start "MindMate Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo Starting frontend development server (port 3000)...
start "MindMate Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo 🎉 MindMate is starting up!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo.
echo ⚠️  Note: This demo uses local file storage instead of a database.
echo For production, set up Supabase and update the .env file.
echo.
echo 🔍 To test the app:
echo 1. Wait for both servers to start (about 30 seconds)
echo 2. Open http://localhost:3000 in your browser
echo 3. Click "Start Voice Check-in"
echo 4. Allow microphone permissions
echo 5. Talk for 30-40 seconds about your day
echo.
echo Press any key to open the app in your browser...
pause >nul

start "" "http://localhost:3000"

echo.
echo 📊 To stop the services:
echo - Close the backend and frontend terminal windows
echo - Or press Ctrl+C in each terminal
echo.
echo 🔧 For troubleshooting, check the terminal windows for error messages.
echo.
pause