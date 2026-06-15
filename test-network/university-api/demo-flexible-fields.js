const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/exam';

// Demo: Showcase Flexible Field Design
async function demonstrateFlexibleFields() {
    console.log('🎯 UNIVERSITY EXAM MANAGEMENT - FLEXIBLE FIELD DEMO');
    console.log('==================================================\n');

    try {
        // 1. Create a basic exam
        console.log('📝 STEP 1: Creating a basic exam...');
        const basicExam = {
            examId: 'DEMO001',
            examName: 'Introduction to Programming',
            courseCode: 'CS101',
            semester: 1,
            examDate: '2024-12-20',
            duration: 120,
            totalMarks: 100,
            passingMarks: 40,
            examType: 'Theory',
            status: 'Scheduled'
        };

        await axios.post(`${BASE_URL}/create`, basicExam);
        console.log('✅ Basic exam created successfully\n');

        // 2. Add custom fields dynamically
        console.log('➕ STEP 2: Adding custom fields dynamically...');
        
        const customFields = [
            { name: 'proctorName', value: 'Dr. Johnson', type: 'string' },
            { name: 'backupVenue', value: 'Room 102', type: 'string' },
            { name: 'examWeightage', value: 0.3, type: 'number' },
            { name: 'isResitAllowed', value: true, type: 'boolean' },
            { name: 'allowedMaterials', value: ['Calculator', 'Formula Sheet'], type: 'array' },
            { name: 'examCoordinator', value: 'Prof. Smith', type: 'string' },
            { name: 'maxAttempts', value: 3, type: 'number' },
            { name: 'resitFee', value: 500, type: 'number' },
            { name: 'gradingScheme', value: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60', type: 'string' },
            { name: 'department', value: 'Computer Science', type: 'string' }
        ];

        for (const field of customFields) {
            await axios.post(`${BASE_URL}/DEMO001/custom-field`, field);
            console.log(`  ✅ Added: ${field.name} = ${JSON.stringify(field.value)} (${field.type})`);
        }
        console.log('');

        // 3. Show the exam with all custom fields
        console.log('📖 STEP 3: Retrieving exam with custom fields...');
        const examResponse = await axios.get(`${BASE_URL}/DEMO001`);
        const exam = examResponse.data.data;
        
        console.log('📋 Exam Details:');
        console.log(`  - ID: ${exam.examId}`);
        console.log(`  - Name: ${exam.examName}`);
        console.log(`  - Course: ${exam.courseCode}`);
        console.log(`  - Custom Fields Count: ${Object.keys(exam.metadata.customFields).length}`);
        console.log('');

        // 4. Show custom fields schema
        console.log('📋 STEP 4: Discovering custom fields schema...');
        const schemaResponse = await axios.get(`${BASE_URL}/schema/custom-fields`);
        const schema = schemaResponse.data.data;
        
        console.log('🔍 Custom Fields Schema:');
        Object.keys(schema).forEach(fieldName => {
            const fieldInfo = schema[fieldName];
            console.log(`  - ${fieldName}: ${fieldInfo.type} (used ${fieldInfo.usageCount} times)`);
        });
        console.log('');

        // 5. Search by custom fields
        console.log('🔍 STEP 5: Searching by custom fields...');
        const searchResults = await axios.post(`${BASE_URL}/search`, {
            'customFields.proctorName': 'Dr. Johnson',
            'customFields.examWeightage': 0.3
        });
        
        console.log(`✅ Search Results: ${searchResults.data.count} exams found`);
        console.log('');

        // 6. Update exam and show field history
        console.log('✏️ STEP 6: Updating exam and tracking changes...');
        await axios.put(`${BASE_URL}/DEMO001`, {
            status: 'In Progress',
            venue: 'Room 103',
            instructions: 'Updated instructions for the exam'
        });

        const historyResponse = await axios.get(`${BASE_URL}/DEMO001/history`);
        const history = historyResponse.data.data;
        
        console.log('📜 Field Change History:');
        history.fieldHistory.forEach((change, index) => {
            console.log(`  ${index + 1}. ${change.timestamp}: ${change.changes.join(', ')}`);
        });
        console.log('');

        // 7. Create another exam with different custom fields
        console.log('📝 STEP 7: Creating another exam with different custom fields...');
        const advancedExam = {
            examId: 'DEMO002',
            examName: 'Advanced Web Development',
            courseCode: 'CS401',
            semester: 4,
            examDate: '2024-12-25',
            duration: 240,
            totalMarks: 150,
            passingMarks: 60,
            examType: 'Practical',
            examMode: 'Online',
            status: 'Scheduled',
            customFields: {
                submissionPlatform: 'GitHub',
                codeReviewRequired: true,
                plagiarismCheck: true,
                allowedFrameworks: ['React', 'Node.js', 'Express'],
                projectType: 'Full-stack Application',
                onlineProctoring: true,
                backupSubmissionEmail: 'submissions@university.edu',
                maxFileSize: 50, // MB
                requiredExtensions: ['.js', '.jsx', '.json', '.md'],
                deploymentRequired: true,
                presentationRequired: true,
                teamSize: 3,
                mentorAssigned: 'Prof. Davis'
            }
        };

        await axios.post(`${BASE_URL}/create`, advancedExam);
        console.log('✅ Advanced exam created with different custom fields\n');

        // 8. Show updated schema
        console.log('📋 STEP 8: Updated custom fields schema...');
        const updatedSchemaResponse = await axios.get(`${BASE_URL}/schema/custom-fields`);
        const updatedSchema = updatedSchemaResponse.data.data;
        
        console.log('🔍 Updated Custom Fields Schema:');
        Object.keys(updatedSchema).forEach(fieldName => {
            const fieldInfo = updatedSchema[fieldName];
            console.log(`  - ${fieldName}: ${fieldInfo.type} (used ${fieldInfo.usageCount} times)`);
        });
        console.log('');

        // 9. Show statistics
        console.log('📊 STEP 9: Exam statistics with custom fields...');
        const statsResponse = await axios.get(`${BASE_URL}/stats/overview`);
        const stats = statsResponse.data.data;
        
        console.log('📈 Statistics:');
        console.log(`  - Total Exams: ${stats.totalExams}`);
        console.log(`  - Custom Fields Count: ${stats.customFieldsCount}`);
        console.log(`  - Average Duration: ${stats.averageDuration.toFixed(1)} minutes`);
        console.log(`  - Average Marks: ${stats.averageMarks.toFixed(1)}`);
        console.log('');

        // 10. Export data
        console.log('📤 STEP 10: Exporting exam data...');
        const exportResponse = await axios.get(`${BASE_URL}/export/json`);
        console.log(`✅ Exported ${exportResponse.data.count} exams in JSON format`);
        console.log('');

        console.log('🎉 FLEXIBLE FIELD DEMO COMPLETED!');
        console.log('==================================================');
        console.log('✅ Key Features Demonstrated:');
        console.log('  - Dynamic field addition without code changes');
        console.log('  - Custom fields with different data types');
        console.log('  - Schema discovery and tracking');
        console.log('  - Search across custom fields');
        console.log('  - Field change history tracking');
        console.log('  - Statistics and analytics');
        console.log('  - Data export capabilities');
        console.log('');
        console.log('🚀 The system is now ready for future field additions!');

    } catch (error) {
        console.error('❌ Demo failed:', error.response?.data || error.message);
        console.log('\n💡 Make sure the exam management API is running on port 3002');
        console.log('   Run: ./start-exam-api.sh');
    }
}

// Run the demo
demonstrateFlexibleFields(); 