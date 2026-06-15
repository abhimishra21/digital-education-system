#!/bin/bash

# Exam Management API Startup Script (Fixed Parameters)
echo "🚀 Starting Exam Management API (Fixed Parameters)..."

# Set environment variables
export DISCOVERY_AS_LOCALHOST=true
export LOG_LEVEL_APP=debug
export LOG_LEVEL_DB=debug
export LOG_LEVEL_CONSOLE=info
export LOG_CONSOLE_STDOUT=true
export PORT=3004

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the API file exists
if [ ! -f "exam-management-api-fixed-params.js" ]; then
    echo "❌ exam-management-api-fixed-params.js not found"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the API
echo "🎯 Starting Exam Management API on port $PORT..."
echo "📊 Health check: http://localhost:$PORT/api/exam/health"
echo "🧪 Test all functions: http://localhost:$PORT/api/exam/test/all"
echo "📚 API Documentation: http://localhost:$PORT/api/exam"
echo ""

node exam-management-api-fixed-params.js 