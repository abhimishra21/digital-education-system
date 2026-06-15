const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/exam';

// Test data with flexible fields
const sampleExams = [
    {
        examId: 'EXAM2024003',
        examName: 'Database Management Systems',
        courseCode: 'CS301',
        semester: 3,
        academicYear: '2024-2025',
        examDate: '2024-12-25',
        duration: 200,
        totalMarks: 120,
        passingMarks: 48,
        examType: 'Theory',
        examMode: 'Offline',
        venue: 'Room 201, Block B',
        maxStudents: 45,
        status: 'Scheduled',
        instructions: 'Bring calculator and database reference book',
        // Custom fields that can be added dynamically
        customFields: {
            proctorName: 'Dr. Williams',
            backupVenue: 'Room 202, Block B',
            specialRequirements: 'Laptop for database queries',
            department: 'Computer Science',
            facultyInCharge: 'Prof. Davis',
            examCoordinator: 'Dr. Brown',
            invigilators: ['Mr. Wilson', 'Ms. Garcia'],
            equipmentRequired: ['Calculator', 'Database Software'],
            backupDate: '2024-12-26',
            examWeightage: 0.3,
            isResitAllowed: true,
            resitFee: 500,
            gradingScheme: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60'
        }
    },
    {
        examId: 'EXAM2024004',
        examName: 'Web Development',
        courseCode: 'CS401',
        semester: 4,
        academicYear: '2024-2025',
        examDate: '2024-12-30',
        duration: 300,
        totalMarks: 150,
        passingMarks: 60,
        examType: 'Practical',
        examMode: 'Online',
        venue: 'Computer Lab 3',
        maxStudents: 25,
        status: 'Scheduled',
        instructions: 'Internet access required, submit via GitHub',
        customFields: {
            proctorName: 'Prof. Martinez',
            backupVenue: 'Computer Lab 4',
            specialRequirements: 'GitHub account, code editor',
            department: 'Computer Science',
            facultyInCharge: 'Dr. Rodriguez',
            examCoordinator: 'Prof. Lee',
            invigilators: ['Mr. Chen', 'Ms. Patel'],
            equipmentRequired: ['Laptop', 'Internet Connection', 'GitHub Account'],
            backupDate: '2024-12-31',
            examWeightage: 0.4,
            isResitAllowed: true,
            resitFee: 750,
            gradingScheme: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60',
            submissionPlatform: 'GitHub',
            codeReviewRequired: true,
            plagiarismCheck: true,
            allowedFrameworks: ['React', 'Node.js', 'Express', 'MongoDB'],
            projectType: 'Full-stack Web Application'
        }
    }
];

// Test functions
async function testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        return false;
    }
}

async function testCreateExam(examData) {
    console.log(`\n📝 Creating Exam: ${examData.examId}`);
    try {
        const response = await axios.post(`${BASE_URL}/create`, examData);
        console.log('✅ Exam Created:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Create Exam Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetExam(examId) {
    console.log(`\n📖 Getting Exam: ${examId}`);
    try {
        const response = await axios.get(`${BASE_URL}/${examId}`);
        console.log('✅ Exam Retrieved:', response.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ Get Exam Failed:', error.response?.data || error.message);
        return null;
    }
}

async function testUpdateExam(examId, updateData) {
    console.log(`\n✏️ Updating Exam: ${examId}`);
    try {
        const response = await axios.put(`${BASE_URL}/${examId}`, updateData);
        console.log('✅ Exam Updated:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Update Exam Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testAddCustomField(examId, fieldName, fieldValue, fieldType = 'string') {
    console.log(`\n➕ Adding Custom Field: ${fieldName} = ${fieldValue}`);
    try {
        const response = await axios.post(`${BASE_URL}/${examId}/custom-field`, {
            fieldName,
            fieldValue,
            fieldType
        });
        console.log('✅ Custom Field Added:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Add Custom Field Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetAllExams() {
    console.log('\n📚 Getting All Exams...');
    try {
        const response = await axios.get(`${BASE_URL}`);
        console.log(`✅ All Exams Retrieved: ${response.data.count} exams found`);
        return response.data.data;
    } catch (error) {
        console.error('❌ Get All Exams Failed:', error.response?.data || error.message);
        return [];
    }
}

async function testSearchExams(searchCriteria) {
    console.log('\n🔍 Searching Exams...');
    try {
        const response = await axios.post(`${BASE_URL}/search`, searchCriteria);
        console.log(`✅ Search Results: ${response.data.count} exams found`);
        console.log('Search Criteria:', searchCriteria);
        return response.data.data;
    } catch (error) {
        console.error('❌ Search Exams Failed:', error.response?.data || error.message);
        return [];
    }
}

async function testGetExamStatistics() {
    console.log('\n📊 Getting Exam Statistics...');
    try {
        const response = await axios.get(`${BASE_URL}/stats/overview`);
        console.log('✅ Exam Statistics:', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ Get Statistics Failed:', error.response?.data || error.message);
        return null;
    }
}

async function testGetExamHistory(examId) {
    console.log(`\n📜 Getting Exam History: ${examId}`);
    try {
        const response = await axios.get(`${BASE_URL}/${examId}/history`);
        console.log('✅ Exam History:', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ Get History Failed:', error.response?.data || error.message);
        return null;
    }
}

async function testGetCustomFieldsSchema() {
    console.log('\n📋 Getting Custom Fields Schema...');
    try {
        const response = await axios.get(`${BASE_URL}/schema/custom-fields`);
        console.log('✅ Custom Fields Schema:', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ Get Schema Failed:', error.response?.data || error.message);
        return null;
    }
}

async function testValidateExamData(examData) {
    console.log('\n✅ Validating Exam Data...');
    try {
        const response = await axios.post(`${BASE_URL}/validate`, examData);
        console.log('✅ Validation Result:', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ Validation Failed:', error.response?.data || error.message);
        return null;
    }
}

async function testExportExamData(format = 'json', filters = {}) {
    console.log(`\n📤 Exporting Exam Data (${format})...`);
    try {
        const response = await axios.get(`${BASE_URL}/export/${format}`, {
            params: { filters: JSON.stringify(filters) }
        });
        console.log(`✅ Export Result: ${response.data.count} exams exported`);
        return response.data.data;
    } catch (error) {
        console.error('❌ Export Failed:', error.response?.data || error.message);
        return null;
    }
}

async function testBulkCreateExams(exams) {
    console.log('\n📦 Bulk Creating Exams...');
    try {
        const response = await axios.post(`${BASE_URL}/bulk/create`, { exams });
        console.log('✅ Bulk Create Result:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Bulk Create Failed:', error.response?.data || error.message);
        return null;
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 Starting Exam Management API Tests...\n');

    // 1. Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('❌ API is not running. Please start the exam management API first.');
        return;
    }

    // 2. Create sample exams
    for (const exam of sampleExams) {
        await testCreateExam(exam);
    }

    // 3. Get and display created exams
    const allExams = await testGetAllExams();
    console.log('\n📋 Created Exams Summary:');
    allExams.forEach(exam => {
        console.log(`  - ${exam.examId}: ${exam.examName} (${exam.courseCode})`);
    });

    // 4. Test getting specific exam
    const exam1 = await testGetExam('EXAM2024003');
    if (exam1) {
        console.log('\n📖 Exam Details:', {
            examId: exam1.examId,
            examName: exam1.examName,
            customFieldsCount: Object.keys(exam1.metadata.customFields || {}).length
        });
    }

    // 5. Test updating exam
    await testUpdateExam('EXAM2024003', {
        status: 'In Progress',
        instructions: 'Updated instructions: Bring laptop and database software'
    });

    // 6. Test adding custom field
    await testAddCustomField('EXAM2024003', 'emergencyContact', '+91-9876543210', 'string');
    await testAddCustomField('EXAM2024003', 'examPriority', 'High', 'string');
    await testAddCustomField('EXAM2024003', 'maxAttempts', 3, 'number');

    // 7. Test search functionality
    await testSearchExams({ courseCode: 'CS301' });
    await testSearchExams({ examType: 'Theory' });
    await testSearchExams({ semester: 3 });

    // 8. Test statistics
    await testGetExamStatistics();

    // 9. Test exam history
    await testGetExamHistory('EXAM2024003');

    // 10. Test custom fields schema
    await testGetCustomFieldsSchema();

    // 11. Test validation
    const invalidExam = {
        examId: 'TEST001',
        examName: 'Test Exam',
        // Missing courseCode
        totalMarks: 'invalid', // Should be number
        passingMarks: 200 // Greater than totalMarks
    };
    await testValidateExamData(invalidExam);

    // 12. Test export functionality
    await testExportExamData('json');
    await testExportExamData('csv');

    // 13. Test bulk operations
    const bulkExams = [
        {
            examId: 'BULK001',
            examName: 'Bulk Test Exam 1',
            courseCode: 'TEST101',
            semester: 1,
            examDate: '2024-12-01',
            duration: 120,
            totalMarks: 100,
            passingMarks: 40,
            examType: 'Theory',
            status: 'Scheduled'
        },
        {
            examId: 'BULK002',
            examName: 'Bulk Test Exam 2',
            courseCode: 'TEST102',
            semester: 2,
            examDate: '2024-12-02',
            duration: 150,
            totalMarks: 120,
            passingMarks: 48,
            examType: 'Practical',
            status: 'Scheduled'
        }
    ];
    await testBulkCreateExams(bulkExams);

    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Key Features Demonstrated:');
    console.log('  ✅ Flexible field design - any field can be added');
    console.log('  ✅ Custom fields tracking with metadata');
    console.log('  ✅ Field history and change tracking');
    console.log('  ✅ Dynamic search capabilities');
    console.log('  ✅ Data validation');
    console.log('  ✅ Export functionality');
    console.log('  ✅ Bulk operations');
    console.log('  ✅ Statistics and analytics');
    console.log('  ✅ Schema discovery for custom fields');
}

// Run tests
runAllTests().catch(console.error); 