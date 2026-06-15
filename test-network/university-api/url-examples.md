# API URL Examples for History Tracking

## Base URL
```
http://localhost:3002/api
```

## 1. Health Check
**URL:** `http://localhost:3002/api/health`
**Method:** GET
**Description:** Check if the API is running and blockchain is connected

**Example Response:**
```json
{
  "success": true,
  "message": "University API is running",
  "blockchain": "Connected",
  "channel": "universitychannel",
  "chaincode": "universityrecord",
  "totalAssets": 32
}
```

## 2. Get All Students
**URL:** `http://localhost:3002/api/students`
**Method:** GET
**Description:** Get all student records

## 3. Get Specific Student
**URL:** `http://localhost:3002/api/students/IMPROVED_TEST001`
**Method:** GET
**Description:** Get details for a specific student

## 4. Get Student History
**URL:** `http://localhost:3002/api/students/IMPROVED_TEST001/history`
**Method:** GET
**Description:** Get complete history for a specific student

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "HISTORY_IMPROVED_TEST001_1732879146404_abc123",
      "studentId": "IMPROVED_TEST001",
      "action": "updated",
      "field": "gpa",
      "oldValue": "3.9",
      "newValue": "4.0",
      "changedBy": "System",
      "changedAt": "2025-07-30T12:19:39.267Z",
      "description": "gpa updated from \"3.9\" to \"4.0\""
    },
    {
      "id": "HISTORY_IMPROVED_TEST001_1732879146404_def456",
      "studentId": "IMPROVED_TEST001",
      "action": "updated",
      "field": "address",
      "oldValue": "456 Tech Street, Innovation City, State",
      "newValue": "999 Success Lane, Achievement City, State",
      "changedBy": "System",
      "changedAt": "2025-07-30T12:19:43.404Z",
      "description": "address updated from \"456 Tech Street, Innovation City, State\" to \"999 Success Lane, Achievement City, State\""
    }
  ]
}
```

## 5. Get All Assets
**URL:** `http://localhost:3002/api/assets`
**Method:** GET
**Description:** Get all assets (including history records)

## 6. Create a New Student
**URL:** `http://localhost:3002/api/students`
**Method:** POST
**Description:** Create a new student record

**Example Request Body:**
```json
{
  "studentId": "NEW_TEST001",
  "name": "Bob Wilson",
  "email": "bob.wilson@university.edu",
  "department": "Engineering",
  "enrollmentYear": 2024,
  "firstName": "Bob",
  "lastName": "Wilson",
  "fathersName": "John Wilson",
  "mothersName": "Mary Wilson",
  "dateOfBirth": "2001-06-20",
  "phoneNo": "+1-555-0303",
  "address": "123 Engineering Blvd, Tech City, State",
  "course": "Mechanical Engineering",
  "status": "Active",
  "semester": 1,
  "gpa": 3.8,
  "admissionDate": "2024-09-01",
  "createdBy": "Test User"
}
```

## 7. Update a Student
**URL:** `http://localhost:3002/api/students/NEW_TEST001`
**Method:** PUT
**Description:** Update an existing student record

**Example Request Body:**
```json
{
  "name": "Bob Anderson",
  "email": "bob.anderson@university.edu",
  "department": "Engineering",
  "enrollmentYear": 2024,
  "firstName": "Bob",
  "lastName": "Anderson",
  "fathersName": "John Anderson",
  "mothersName": "Mary Anderson",
  "dateOfBirth": "2001-06-20",
  "phoneNo": "+1-555-0404",
  "address": "456 Engineering Ave, Tech City, State",
  "course": "Mechanical Engineering",
  "status": "Active",
  "semester": 2,
  "gpa": 3.9,
  "admissionDate": "2024-09-01",
  "createdBy": "Test User"
}
```

## 8. Delete a Student
**URL:** `http://localhost:3002/api/students/NEW_TEST001`
**Method:** DELETE
**Description:** Delete a student record

## How to Test in Browser

1. **Open your web browser**
2. **Navigate to:** `http://localhost:3002/api/health`
3. **You should see:** JSON response showing API status
4. **Try other URLs:**
   - `http://localhost:3002/api/students` - List all students
   - `http://localhost:3002/api/students/IMPROVED_TEST001/history` - View student history

## How to Test with curl

```bash
# Health check
curl http://localhost:3002/api/health

# Get all students
curl http://localhost:3002/api/students

# Get student history
curl http://localhost:3002/api/students/IMPROVED_TEST001/history

# Create a student (POST request)
curl -X POST http://localhost:3002/api/students \
  -H "Content-Type: application/json" \
  -d '{"studentId":"TEST002","name":"John Doe","email":"john@example.com","department":"CS","enrollmentYear":2024}'
```

## History Tracking Features

✅ **Meaningful Old/New Values:** Shows actual field changes instead of null
✅ **Field-Level Tracking:** Tracks changes to individual fields
✅ **Timestamp Tracking:** Records when changes occurred
✅ **User Tracking:** Records who made the changes
✅ **Complete Audit Trail:** Maintains full history of all changes
✅ **Blockchain Storage:** All history is stored on the blockchain for immutability 