# 🎓 University Records Management API

A comprehensive web API for managing university records using Hyperledger Fabric blockchain with full versioning support.

## 🚀 Features

- **Student Management** - Create, read, update with versioning
- **Faculty Management** - Complete faculty record management
- **Course Management** - Course catalog and management
- **Enrollment Management** - Student course enrollments
- **Grade Management** - Academic performance tracking
- **Full Versioning** - Complete audit trail of all changes
- **Blockchain Integration** - All data stored on Hyperledger Fabric
- **RESTful API** - Easy integration with web applications

## 📋 Prerequisites

- Node.js 16+ installed
- Hyperledger Fabric network running
- Channel: `universitychannel`
- Chaincode: `universityrecord`

## 🔧 Installation

```bash
# Navigate to the API directory
cd test-network/university-api

# Install dependencies
npm install

# Start the API server
npm start
```

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Student Management
```
POST   /api/students                    # Create new student
GET    /api/students                    # Get all students
GET    /api/students/:studentId         # Get specific student
PUT    /api/students/:studentId         # Update student
GET    /api/students/:studentId/history # Get student version history
GET    /api/search/students             # Search students by department/year
```

### Faculty Management
```
POST   /api/faculty                     # Create new faculty
GET    /api/faculty                     # Get all faculty
GET    /api/faculty/:facultyId          # Get specific faculty
PUT    /api/faculty/:facultyId          # Update faculty
```

### Course Management
```
POST   /api/courses                     # Create new course
GET    /api/courses                     # Get all courses
GET    /api/courses/:courseId           # Get specific course
PUT    /api/courses/:courseId           # Update course
```

### Enrollment Management
```
POST   /api/enrollments                 # Create new enrollment
GET    /api/enrollments/:enrollmentId   # Get specific enrollment
```

### Grade Management
```
POST   /api/grades                      # Create new grade
PUT    /api/grades/:gradeId             # Update grade
```

## 📝 API Usage Examples

### Create a Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "department": "Computer Science",
    "enrollmentYear": 2023
  }'
```

### Update a Student
```bash
curl -X PUT http://localhost:3000/api/students/STU001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@university.edu"
  }'
```

### Get Student History
```bash
curl -X GET http://localhost:3000/api/students/STU001/history
```

### Create Faculty
```bash
curl -X POST http://localhost:3000/api/faculty \
  -H "Content-Type: application/json" \
  -d '{
    "facultyId": "FAC001",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@university.edu",
    "department": "Computer Science",
    "designation": "Associate Professor"
  }'
```

### Create Course
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "CS101",
    "name": "Introduction to Programming",
    "department": "Computer Science",
    "credits": 3,
    "instructor": "FAC001"
  }'
```

### Create Enrollment
```bash
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "ENR001",
    "studentId": "STU001",
    "courseId": "CS101",
    "semester": "Fall",
    "year": 2023
  }'
```

### Create Grade
```bash
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -d '{
    "gradeId": "GRD001",
    "studentId": "STU001",
    "courseId": "CS101",
    "grade": "A",
    "semester": "Fall",
    "year": 2023
  }'
```

## 🔐 Versioning System

Every record maintains a complete version history:

- **Version Number** - Increments with each update
- **Timestamp** - When the change was made
- **Action** - CREATE, UPDATE, DELETE
- **Previous Version** - Reference to the previous version
- **Complete Audit Trail** - All changes are permanently recorded

### Version History Example
```json
[
  {
    "recordId": "STU001",
    "recordType": "STUDENT",
    "data": "...",
    "version": 1,
    "timestamp": "2023-01-15T10:30:00Z",
    "action": "CREATE"
  },
  {
    "recordId": "STU001",
    "recordType": "STUDENT", 
    "data": "...",
    "version": 2,
    "timestamp": "2023-02-20T14:45:00Z",
    "action": "UPDATE"
  }
]
```

## 🏗️ Data Models

### Student
```json
{
  "studentId": "string",
  "name": "string",
  "email": "string",
  "department": "string",
  "enrollmentYear": "number",
  "version": "number",
  "timestamp": "string",
  "action": "string",
  "previousVersion": "number"
}
```

### Faculty
```json
{
  "facultyId": "string",
  "name": "string",
  "email": "string",
  "department": "string",
  "designation": "string",
  "version": "number",
  "timestamp": "string",
  "action": "string",
  "previousVersion": "number"
}
```

### Course
```json
{
  "courseId": "string",
  "name": "string",
  "department": "string",
  "credits": "number",
  "instructor": "string",
  "version": "number",
  "timestamp": "string",
  "action": "string",
  "previousVersion": "number"
}
```

### Enrollment
```json
{
  "enrollmentId": "string",
  "studentId": "string",
  "courseId": "string",
  "semester": "string",
  "year": "number",
  "version": "number",
  "timestamp": "string",
  "action": "string",
  "previousVersion": "number"
}
```

### Grade
```json
{
  "gradeId": "string",
  "studentId": "string",
  "courseId": "string",
  "grade": "string",
  "semester": "string",
  "year": "number",
  "version": "number",
  "timestamp": "string",
  "action": "string",
  "previousVersion": "number"
}
```

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # API server port
CHANNEL_NAME=universitychannel
CHAINCODE_NAME=universityrecord
MSP_ID=Org1MSP
```

### Blockchain Configuration
The API automatically connects to your running Fabric network:
- **Channel**: `universitychannel`
- **Chaincode**: `universityrecord`
- **Organization**: `Org1MSP`
- **Peer**: `localhost:7051`

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t university-api .
docker run -p 3000:3000 university-api
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs
```bash
# View API logs
tail -f logs/api.log

# View blockchain connection logs
docker logs peer0.org1.example.com
```

## 🔍 Troubleshooting

### Common Issues

1. **Blockchain Connection Failed**
   - Ensure Fabric network is running
   - Check channel and chaincode names
   - Verify crypto materials exist

2. **API Server Won't Start**
   - Check Node.js version (16+)
   - Verify all dependencies installed
   - Check port availability

3. **Transaction Failures**
   - Check chaincode deployment
   - Verify endorsement policy
   - Review transaction logs

### Debug Commands
```bash
# Check blockchain status
./network.sh status

# Check chaincode deployment
peer lifecycle chaincode querycommitted -C universitychannel -n universityrecord

# Test chaincode functions
./network.sh cc query -c universitychannel -ccn universityrecord -ccqc '{"Args":["GetAllStudents"]}'
```

## 📚 Integration Examples

### Frontend Integration (JavaScript)
```javascript
// Create student
const response = await fetch('/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'STU001',
    name: 'John Doe',
    email: 'john@university.edu',
    department: 'Computer Science',
    enrollmentYear: 2023
  })
});

const result = await response.json();
```

### Python Integration
```python
import requests

# Create student
response = requests.post('http://localhost:3000/api/students', json={
    'studentId': 'STU001',
    'name': 'John Doe',
    'email': 'john@university.edu',
    'department': 'Computer Science',
    'enrollmentYear': 2023
})

result = response.json()
```

## 🔐 Security Features

- **TLS Encryption** - All blockchain communications encrypted
- **Access Control** - MSP-based authentication
- **Audit Trail** - Complete transaction history
- **Data Integrity** - Immutable blockchain storage
- **Version Control** - Full change tracking

## 📈 Performance

- **Concurrent Transactions** - Supports multiple simultaneous operations
- **Caching** - Optional Redis caching for frequently accessed data
- **Connection Pooling** - Efficient blockchain connections
- **Async Operations** - Non-blocking API responses

## 🎯 Next Steps

1. **Deploy Chaincode** - Deploy the universityrecord chaincode
2. **Start API Server** - Run the Node.js API
3. **Test Endpoints** - Verify all API endpoints work
4. **Integrate Frontend** - Connect your web application
5. **Monitor Performance** - Set up monitoring and alerts

---

**✅ Your University Records Management System is ready!** 