# Current Students Summary

## 📊 System Overview
- **Total Students:** 9
- **Total Assets:** 93 (including history records)
- **API Status:** Running on port 3002
- **Blockchain:** Connected

## 👥 Current Student IDs

### 1. STUDENT_101
- **Enrollment No:** 101
- **Name:** Ankit Sharma2
- **Course:** Computer Science
- **Enrollment Year:** 2021
- **Status:** Active

### 2. STUDENT_A-1730
- **Enrollment No:** A-1730
- **Name:** Adarsh Sinha
- **Course:** Computer Science
- **Enrollment Year:** 2025
- **Status:** Active

### 3. STUDENT_A100
- **Enrollment No:** A100
- **Name:** ff78
- **Course:** Computer Science
- **Enrollment Year:** 2021
- **Status:** Active

### 4. STUDENT_B107
- **Enrollment No:** B107
- **Name:** AAAD
- **Course:** Computer Science
- **Enrollment Year:** 2020
- **Status:** Active

### 5. STUDENT_STU001
- **Enrollment No:** STU001
- **Name:** John Doe
- **Course:** Computer Science
- **Enrollment Year:** 2023
- **Status:** Active

### 6. STUDENT_UNI001
- **Enrollment No:** UNI001
- **Name:** Alice Johnson
- **Course:** Computer Science
- **Enrollment Year:** 2024
- **Status:** Active

### 7. STUDENT_UNI_1753697043936
- **Enrollment No:** UNI_1753697043936
- **Name:** Alice Johnson
- **Course:** Computer Science
- **Enrollment Year:** 2024
- **Status:** Active

### 8. STUDENT_UNI_1753697095497
- **Enrollment No:** UNI_1753697095497
- **Name:** Alice Johnson
- **Course:** Computer Science
- **Enrollment Year:** 2024
- **Status:** Active

### 9. STUDENT_VERSION001
- **Enrollment No:** VERSION001
- **Name:** Unknown
- **Course:** Computer Science
- **Enrollment Year:** 2024
- **Status:** Active

## 🔍 How to Check Student Details

### Get All Students
```bash
curl http://localhost:3002/api/students
```

### Get Specific Student (using enrollment number)
```bash
curl http://localhost:3002/api/students/101
curl http://localhost:3002/api/students/A-1730
curl http://localhost:3002/api/students/STU001
```

### Get Student History
```bash
curl http://localhost:3002/api/students/101/history
curl http://localhost:3002/api/students/A-1730/history
curl http://localhost:3002/api/students/STU001/history
```

## 🌐 Browser Access

You can also view this information in your browser:

- **All Students:** http://localhost:3002/api/students
- **Specific Student:** http://localhost:3002/api/students/101
- **Student History:** http://localhost:3002/api/students/101/history

## 📝 Notes

- Student IDs are stored as `STUDENT_{enrollment_number}`
- The enrollment number is the part after "STUDENT_" in the ID
- All students are currently enrolled in Computer Science
- Most students were enrolled between 2020-2025
- History tracking is available for students created through the new API

## 🔧 Recent Test Students

The following test students were created during our testing and may have been deleted:

- `HISTORY_TEST001` - Used for history tracking tests
- `IMPROVED_TEST001` - Used for improved history tests
- `OLD_VALUE_TEST001` - Used for old value tracking tests
- `REAL_OLD_TEST001` - Used for real old value tests
- `URL_DEMO_001` - Used for URL demonstration

These test students have comprehensive history records showing field-level changes. 