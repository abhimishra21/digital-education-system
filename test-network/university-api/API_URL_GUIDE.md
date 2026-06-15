# API URL Access Guide

## 🌐 Base URL
```
http://localhost:3002/api
```

## 📋 Available Endpoints

### 1. Health Check
**URL:** `GET http://localhost:3002/api/health`
**Description:** Check if the API is running and blockchain is connected

**Example Response:**
```json
{
  "success": true,
  "message": "University API is running",
  "blockchain": "Connected",
  "channel": "universitychannel",
  "chaincode": "universityrecord",
  "totalAssets": 93
}
```

**Test with curl:**
```bash
curl http://localhost:3002/api/health
```

**Test in browser:**
```
http://localhost:3002/api/health
```

### 2. Get All Students
**URL:** `GET http://localhost:3002/api/students`
**Description:** Get all student records

**Test with curl:**
```bash
curl http://localhost:3002/api/students
```

**Test in browser:**
```
http://localhost:3002/api/students
```

### 3. Get Specific Student
**URL:** `GET http://localhost:3002/api/students/{studentId}`
**Description:** Get details for a specific student

**Example:**
```bash
curl http://localhost:3002/api/students/STUDENT001
```

**Test in browser:**
```
http://localhost:3002/api/students/STUDENT001
```

### 4. Get Student History
**URL:** `GET http://localhost:3002/api/students/{studentId}/history`
**Description:** Get complete history for a specific student

**Example:**
```bash
curl http://localhost:3002/api/students/STUDENT001/history
```

**Test in browser:**
```
http://localhost:3002/api/students/STUDENT001/history
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "HISTORY_STUDENT001_1732879146404_abc123",
      "studentId": "STUDENT001",
      "action": "updated",
      "field": "gpa",
      "oldValue": "3.6",
      "newValue": "3.9",
      "changedBy": "System",
      "changedAt": "2025-07-30T12:30:44.382Z",
      "description": "gpa updated from \"3.6\" to \"3.9\""
    },
    {
      "id": "HISTORY_STUDENT001_1732879146404_def456",
      "studentId": "STUDENT001",
      "action": "updated",
      "field": "address",
      "oldValue": "567 Maple Drive, Tech City, State",
      "newValue": "789 Innovation Street, Future City, State",
      "changedBy": "System",
      "changedAt": "2025-07-30T12:30:49.535Z",
      "description": "address updated from \"567 Maple Drive, Tech City, State\" to \"789 Innovation Street, Future City, State\""
    }
  ]
}
```

### 5. Get All Assets
**URL:** `GET http://localhost:3002/api/assets`
**Description:** Get all assets (including history records)

**Test with curl:**
```bash
curl http://localhost:3002/api/assets
```

**Test in browser:**
```
http://localhost:3002/api/assets
```

### 6. Create a New Student
**URL:** `POST http://localhost:3002/api/students`
**Description:** Create a new student record

**Example Request:**
```bash
curl -X POST http://localhost:3002/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "NEW_STUDENT001",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "department": "Computer Science",
    "enrollmentYear": 2024,
    "firstName": "John",
    "lastName": "Doe",
    "fathersName": "Robert Doe",
    "mothersName": "Jane Doe",
    "dateOfBirth": "2000-01-15",
    "phoneNo": "+1-555-0123",
    "address": "123 University St, City, State",
    "course": "Computer Science",
    "status": "Active",
    "semester": 1,
    "gpa": 3.5,
    "admissionDate": "2024-09-01",
    "createdBy": "Test User"
  }'
```

### 7. Update a Student
**URL:** `PUT http://localhost:3002/api/students/{studentId}`
**Description:** Update an existing student record

**Example Request:**
```bash
curl -X PUT http://localhost:3002/api/students/NEW_STUDENT001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@university.edu",
    "department": "Information Technology",
    "enrollmentYear": 2024,
    "firstName": "John",
    "lastName": "Smith",
    "fathersName": "Robert Smith",
    "mothersName": "Jane Smith",
    "dateOfBirth": "2000-01-15",
    "phoneNo": "+1-555-0456",
    "address": "456 University St, City, State",
    "course": "Information Technology",
    "status": "Active",
    "semester": 2,
    "gpa": 3.8,
    "admissionDate": "2024-09-01",
    "createdBy": "Test User"
  }'
```

### 8. Delete a Student
**URL:** `DELETE http://localhost:3002/api/students/{studentId}`
**Description:** Delete a student record

**Example:**
```bash
curl -X DELETE http://localhost:3002/api/students/NEW_STUDENT001
```

## 🧪 Testing Examples

### Quick Health Check
```bash
curl -s "http://localhost:3002/api/health" | jq .
```

### Get Student Count
```bash
curl -s "http://localhost:3002/api/students" | jq '.data | length'
```

### Get Asset Count
```bash
curl -s "http://localhost:3002/api/assets" | jq '.data | length'
```

### Get Recent History
```bash
curl -s "http://localhost:3002/api/students/STUDENT001/history" | jq '.data[0:3]'
```

## 🌐 Browser Testing

You can also test these URLs directly in your web browser:

1. **Health Check:** `http://localhost:3002/api/health`
2. **All Students:** `http://localhost:3002/api/students`
3. **All Assets:** `http://localhost:3002/api/assets`
4. **Student History:** `http://localhost:3002/api/students/{studentId}/history`

## 📊 History Tracking Features

✅ **Field-Level Tracking:** Tracks changes to individual fields
✅ **Old/New Values:** Shows actual field changes with before/after values
✅ **Timestamp Tracking:** Records when changes occurred
✅ **User Tracking:** Records who made the changes
✅ **Complete Audit Trail:** Maintains full history of all changes
✅ **Blockchain Storage:** All history is stored on the blockchain for immutability

## 🔧 Troubleshooting

### If you get a 404 error:
- Make sure the API server is running on port 3002
- Check that the student ID exists
- Verify the URL is correct

### If you get a 500 error:
- Check the server logs for detailed error information
- Ensure the blockchain network is running
- Verify the chaincode is deployed

### If history shows "null" values:
- This is normal for initial creation
- Subsequent updates will show the actual old values
- The system tracks changes from the previous state

## 📝 Notes

- All data is stored on the Hyperledger Fabric blockchain
- History is immutable and cannot be modified
- Each change creates a new history record
- The API supports CORS for web applications
- All timestamps are in ISO 8601 format 