#!/bin/bash

echo "🧪 Testing Exam Management API Endpoints"
echo "========================================"

# Test health endpoint
echo "1. Testing Health Check..."
curl -s -X GET http://localhost:3002/api/exam/health | jq .
echo ""

# Test get all exams
echo "2. Testing Get All Exams..."
curl -s -X GET http://localhost:3002/api/exam | jq .
echo ""

# Test get exam by ID
echo "3. Testing Get Exam by ID..."
curl -s -X GET http://localhost:3002/api/exam/EXAM2024001 | jq .
echo ""

# Test get exams by course
echo "4. Testing Get Exams by Course..."
curl -s -X GET http://localhost:3002/api/exam/course/CS101 | jq .
echo ""

# Test exam statistics
echo "5. Testing Exam Statistics..."
curl -s -X GET http://localhost:3002/api/exam/stats/overview | jq .
echo ""

# Test search exams
echo "6. Testing Search Exams..."
curl -s -X POST http://localhost:3002/api/exam/search \
  -H "Content-Type: application/json" \
  -d '{"courseCode": "CS101"}' | jq .
echo ""

# Test create exam (will likely fail due to endorsement policy)
echo "7. Testing Create Exam (may fail due to endorsement policy)..."
curl -s -X POST http://localhost:3002/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "TEST001",
    "examName": "Test Exam",
    "courseCode": "TEST101",
    "duration": 60,
    "totalMarks": 50
  }' | jq .
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "📝 Summary:"
echo "- Read operations (GET) should work correctly"
echo "- Write operations (POST/PUT) may fail due to endorsement policy"
echo "- The API provides clear error messages for endorsement failures" 