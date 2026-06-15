#!/bin/bash

echo "🚀 Starting University Records Management Full Stack..."

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

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend API
echo "🔧 Starting backend API..."
node app.js &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend started successfully
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend API is running on port 3001"

# Navigate to frontend directory and install dependencies if needed
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
fi

# Start frontend
echo "🌐 Starting frontend..."
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Full stack application is starting..."
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait 