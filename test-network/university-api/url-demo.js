const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function demonstrateUrlAccess() {
    console.log('🌐 Demonstrating API URL Access and History Tracking\n');

    try {
        // Step 1: Health Check
        console.log('1. 🔍 Health Check');
        console.log(`   URL: ${API_BASE_URL}/health`);
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('   ✅ API is running');
        console.log(`   📊 Total Assets: ${healthResponse.data.totalAssets}`);
        console.log(`   🔗 Blockchain: ${healthResponse.data.blockchain}`);
        console.log(`   📋 Channel: ${healthResponse.data.channel}`);
        console.log(`   🔧 Chaincode: ${healthResponse.data.chaincode}\n`);

        // Step 2: Create a new student
        console.log('2. 📝 Creating a new student');
        console.log(`   URL: POST ${API_BASE_URL}/students`);
        const createData = {
            studentId: 'URL_DEMO_001',
            name: 'Emma Wilson',
            email: 'emma.wilson@university.edu',
            department: 'Computer Science',
            enrollmentYear: 2024,
            firstName: 'Emma',
            lastName: 'Wilson',
            fathersName: 'Robert Wilson',
            mothersName: 'Sarah Wilson',
            dateOfBirth: '2001-05-15',
            phoneNo: '+1-555-0909',
            address: '567 Maple Drive, Tech City, State',
            course: 'Computer Science',
            status: 'Active',
            semester: 1,
            gpa: 3.6,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/students`, createData);
        console.log('   ✅ Student created successfully');
        console.log(`   📊 Student ID: ${createData.studentId}\n`);

        // Wait for blockchain to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Get student details
        console.log('3. 📚 Getting student details');
        console.log(`   URL: GET ${API_BASE_URL}/students/${createData.studentId}`);
        const studentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student details retrieved');
        console.log(`   📝 Name: ${studentResponse.data.data.Owner}`);
        console.log(`   📝 Department: ${studentResponse.data.data.Color}`);
        console.log(`   📝 Enrollment Year: ${studentResponse.data.data.Size}\n`);

        // Step 4: Update student with meaningful changes
        console.log('4. ✏️  Updating student with meaningful changes');
        console.log(`   URL: PUT ${API_BASE_URL}/students/${createData.studentId}`);
        
        // Update 1: Change GPA
        console.log('   🔄 Updating GPA from 3.6 to 3.9...');
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, { gpa: 3.9 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update 2: Change address
        console.log('   🔄 Updating address...');
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, { 
            address: '789 Innovation Street, Future City, State' 
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update 3: Change course and department
        console.log('   🔄 Updating course and department...');
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, { 
            course: 'Artificial Intelligence',
            department: 'AI Department'
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('   ✅ All updates completed\n');

        // Step 5: Get student history
        console.log('5. 📚 Getting student history');
        console.log(`   URL: GET ${API_BASE_URL}/students/${createData.studentId}/history`);
        const historyResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log(`   📊 Total history records: ${historyResponse.data.data.length}\n`);

        // Step 6: Display history with old and new values
        console.log('6. 📋 History with Old → New Values:');
        console.log('   ' + '='.repeat(80));
        
        if (historyResponse.data.data.length > 0) {
            // Filter for update entries only
            const updateEntries = historyResponse.data.data.filter(entry => 
                entry.action === 'updated' && entry.field !== 'all'
            );
            
            updateEntries.forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.field.toUpperCase()}`);
                console.log(`      📅 Time: ${entry.changedAt}`);
                console.log(`      👤 Changed by: ${entry.changedBy}`);
                console.log(`      📝 Old Value: "${entry.oldValue}"`);
                console.log(`      📝 New Value: "${entry.newValue}"`);
                console.log(`      📋 Description: ${entry.description}`);
                console.log('   ' + '-'.repeat(80));
            });
        }

        // Step 7: Get all students
        console.log('\n7. 📊 Getting all students');
        console.log(`   URL: GET ${API_BASE_URL}/students`);
        const allStudentsResponse = await axios.get(`${API_BASE_URL}/students`);
        console.log('   ✅ All students retrieved');
        console.log(`   📊 Total students: ${allStudentsResponse.data.data.length}\n`);

        // Step 8: Get all assets
        console.log('8. 📋 Getting all assets');
        console.log(`   URL: GET ${API_BASE_URL}/assets`);
        const allAssetsResponse = await axios.get(`${API_BASE_URL}/assets`);
        console.log('   ✅ All assets retrieved');
        console.log(`   📊 Total assets: ${allAssetsResponse.data.data.length}\n`);

        // Step 9: Delete student
        console.log('9. 🗑️  Deleting student');
        console.log(`   URL: DELETE ${API_BASE_URL}/students/${createData.studentId}`);
        const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student deleted successfully\n');

        // Step 10: Show URL examples
        console.log('10. 🌐 URL Examples for Manual Testing:');
        console.log('   ' + '='.repeat(80));
        console.log('   🔗 Health Check:');
        console.log(`      curl ${API_BASE_URL}/health`);
        console.log('');
        console.log('   🔗 Get All Students:');
        console.log(`      curl ${API_BASE_URL}/students`);
        console.log('');
        console.log('   🔗 Get All Assets:');
        console.log(`      curl ${API_BASE_URL}/assets`);
        console.log('');
        console.log('   🔗 Create Student (POST):');
        console.log(`      curl -X POST ${API_BASE_URL}/students \\`);
        console.log('        -H "Content-Type: application/json" \\');
        console.log('        -d \'{"studentId":"TEST002","name":"John Doe","email":"john@example.com","department":"CS","enrollmentYear":2024}\'');
        console.log('');
        console.log('   🔗 Browser Access:');
        console.log(`      Health: http://localhost:3002/api/health`);
        console.log(`      Students: http://localhost:3002/api/students`);
        console.log(`      Assets: http://localhost:3002/api/assets`);

        console.log('\n✅ URL demonstration completed successfully!');
        console.log('🎉 You can now test the API through URLs in your browser or with curl!');

    } catch (error) {
        console.error('❌ Demonstration failed:', error.response?.data || error.message);
        console.error('🔍 Error details:', error.response?.status, error.response?.statusText);
    }
}

// Run the demonstration
demonstrateUrlAccess(); 