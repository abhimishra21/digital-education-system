#!/bin/bash

echo "🗑️  Clearing all student data from blockchain..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Run the clear data script
node clear-all-data.js

echo ""
echo "🏁 Script execution completed!" 