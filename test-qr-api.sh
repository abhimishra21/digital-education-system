#!/bin/bash

# QR Scanner API Test Script
# This script tests the QR decryption API endpoint

echo "🔐 QR Scanner API Test Script"
echo "=============================="

# API Base URL
API_BASE="http://135.235.51.143:3002/api/academic"

# Test encrypted data (your actual encrypted data)
TEST_DATA="wAPbnX7vhHfcNuxo6nxUwhLOGEqHb9aDhx5uUCibqT0CtfoAhUieNizG%2F31dQq9qvZaaHkcIfvth4beoAmP1kt7d%2F5RizZmdbzNFo%2FfRv%2BnRgjck7Yap8RtIwgwiNcZJBFF0cB5XcSNFwqx%2BSU4W2RMb8hvgH8Z9OKJOOsGN7g%2FuPXl4ZyuRsFP2buVgS5FWCH6EKunB1jC5IAURXL5IlEl3d%2F4F5pUIFHjfE2uQMglPnLh1%2FXJPJZJeyfeQHbk2"

echo ""
echo "1. Testing QR Decryption API..."
echo "URL: ${API_BASE}/records/decrypt-url?data=${TEST_DATA}"
echo ""

# Test the decryption endpoint
response=$(curl -s -X GET "${API_BASE}/records/decrypt-url?data=${TEST_DATA}")

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "2. Testing with invalid data..."
echo ""

# Test with invalid data
invalid_response=$(curl -s -X GET "${API_BASE}/records/decrypt-url?data=invalid-data")

echo "Invalid Data Response:"
echo "$invalid_response" | jq '.' 2>/dev/null || echo "$invalid_response"

echo ""
echo "3. Testing without data parameter..."
echo ""

# Test without data parameter
no_data_response=$(curl -s -X GET "${API_BASE}/records/decrypt-url")

echo "No Data Response:"
echo "$no_data_response" | jq '.' 2>/dev/null || echo "$no_data_response"

echo ""
echo "4. Testing regular enrollment lookup..."
echo ""

# Test regular enrollment lookup
enrollment_response=$(curl -s -X GET "${API_BASE}/records/506027972")

echo "Enrollment Lookup Response:"
echo "$enrollment_response" | jq '.' 2>/dev/null || echo "$enrollment_response"

echo ""
echo "✅ API Testing Complete!"
echo ""
echo "To test the full QR scanner functionality:"
echo "1. Open test-qr-scanner.html in your browser"
echo "2. Click the test buttons to verify functionality"
echo "3. Check the console logs for detailed information"
echo ""
echo "To test with a real QR code URL:"
echo "http://135.235.51.143:3000/test-qr-scanner.html?data=${TEST_DATA}"
