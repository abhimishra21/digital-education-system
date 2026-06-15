#!/bin/bash

# Exam Management API Startup Script
# This script starts the flexible exam management API

echo "🚀 Starting University Exam Management API..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    echo "💡 Using NVM to switch to Node.js 16..."
    if command -v nvm &> /dev/null; then
        nvm use 16
    else
        echo "❌ NVM is not installed. Please install NVM or upgrade Node.js manually."
        exit 1
    fi
fi

echo "✅ Node.js version: $(node -v)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if the exam management API file exists
if [ ! -f "exam-management-api.js" ]; then
    echo "❌ exam-management-api.js not found!"
    echo "Please ensure you're in the correct directory: /home/akmishra1/Desktop/fabric-samples/test-network/university-api"
    exit 1
fi

# Check if the chaincode file exists
if [ ! -f "chaincode/exam-management.js" ]; then
    echo "❌ chaincode/exam-management.js not found!"
    echo "Please ensure the exam management chaincode is properly installed."
    exit 1
fi

echo "🔧 Starting Exam Management API on port 3002..."
echo "📊 Health check will be available at: http://localhost:3002/api/exam/health"
echo "📚 API documentation will be available at: http://localhost:3002/api/exam"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=============================================="

# Start the exam management API
node exam-management-api.js 