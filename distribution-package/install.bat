
@echo off
echo 🎲 Installing Backgammon Tournament Manager...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    echo    After installing Node.js, run this installer again.
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo 🏗️ Building the application...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Failed to build application
    pause
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo 🎲 Starting Backgammon Tournament Manager...
echo    The application will open in your browser at http://localhost:3000
echo    Press Ctrl+C to stop the server when you're done.
echo.
npm start
