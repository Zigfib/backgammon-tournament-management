
#!/bin/bash

echo "🎲 Installing Backgammon Tournament Manager..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    echo "   After installing Node.js, run this installer again."
    exit 1
fi

echo "✅ Node.js detected"
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🏗️ Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

echo
echo "✅ Installation complete!"
echo
echo "🎲 Starting Backgammon Tournament Manager..."
echo "   The application will open in your browser at http://localhost:3000"
echo "   Press Ctrl+C to stop the server when you're done."
echo
npm start
