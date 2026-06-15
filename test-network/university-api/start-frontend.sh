#!/bin/bash

echo "🚀 Starting University Records Management Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if backend is running
echo "🔍 Checking backend connection..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend API is running on port 3001"
else
    echo "⚠️  Warning: Backend API is not running on port 3001"
    echo "   Please start the backend API first:"
    echo "   cd .. && node app.js"
    echo ""
    echo "   Or run both together:"
    echo "   ./start-full-stack.sh"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🌐 Starting React development server..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start 