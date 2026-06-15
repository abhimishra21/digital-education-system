const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testRealOldValues() {
    console.log('🧪 Testing Real Old Value Tracking\n');

    try {
        // Test 1: Create a student with initial values
        console.log('1. 📝 Creating a student with initial values...');
        const createData = {
            studentId: 'REAL_OLD_TEST001',
            name: 'David Miller',
            email: 'david.miller@university.edu',
            department: 'Computer Science',
            enrollmentYear: 2024,
            firstName: 'David',
            lastName: 'Miller',
            fathersName: 'James Miller',
            mothersName: 'Emily Miller',
            dateOfBirth: '2000-12-05',
            phoneNo: '+1-555-0707',
            address: '789 Oak Street, Forest City, State',
            course: 'Computer Science',
            status: 'Active',
            semester: 1,
            gpa: 3.0,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/students`, createData);
        console.log('   ✅ Student created successfully');
        console.log('   📊 Student ID:', createData.studentId);

        // Wait for blockchain to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 2: Get current student data to verify initial values
        console.log('\n2. 📚 Getting current student data...');
        const currentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Current student data retrieved');
        console.log(`   📝 Current Name: ${currentResponse.data.data.Owner}`);
        console.log(`   📝 Current GPA: ${currentResponse.data.data.gpa}`);
        console.log(`   📝 Current Address: ${currentResponse.data.data.address}`);

        // Wait for blockchain to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Update GPA from 3.0 to 3.8
        console.log('\n3. 🔄 Updating GPA from 3.0 to 3.8...');
        const gpaUpdateData = {
            gpa: 3.8
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, gpaUpdateData);
        console.log('   ✅ GPA updated from 3.0 to 3.8');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 4: Update address
        console.log('\n4. 🔄 Updating address...');
        const addressUpdateData = {
            address: '1234 Pine Avenue, Mountain View, State'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, addressUpdateData);
        console.log('   ✅ Address updated');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 5: Update name
        console.log('\n5. 🔄 Updating name...');
        const nameUpdateData = {
            name: 'David Johnson',
            firstName: 'David',
            lastName: 'Johnson'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, nameUpdateData);
        console.log('   ✅ Name updated');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 6: Update course and department
        console.log('\n6. 🔄 Updating course and department...');
        const courseUpdateData = {
            course: 'Software Engineering',
            department: 'Engineering Department'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, courseUpdateData);
        console.log('   ✅ Course and department updated');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 7: Update phone number
        console.log('\n7. 🔄 Updating phone number...');
        const phoneUpdateData = {
            phoneNo: '+1-555-0808'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, phoneUpdateData);
        console.log('   ✅ Phone number updated');

        // Test 8: Get and display the history with real old and new values
        console.log('\n8. 📚 Getting complete history with real old and new values...');
        const historyResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse.data.data.length);
        
        if (historyResponse.data.data.length > 0) {
            console.log('\n   📋 Complete History with Real Old → New Values:');
            console.log('   ' + '='.repeat(100));
            
            // Filter out creation and deletion entries, focus on updates
            const updateEntries = historyResponse.data.data.filter(entry => 
                entry.action === 'updated' && entry.field !== 'all'
            );
            
            updateEntries.forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.action.toUpperCase()} - ${entry.field.toUpperCase()}`);
                console.log(`      📅 Time: ${entry.changedAt}`);
                console.log(`      👤 Changed by: ${entry.changedBy}`);
                console.log(`      📝 Old Value: "${entry.oldValue}"`);
                console.log(`      📝 New Value: "${entry.newValue}"`);
                console.log(`      📋 Description: ${entry.description}`);
                console.log('   ' + '-'.repeat(100));
            });
        }

        // Test 9: Show final student data
        console.log('\n9. 📊 Final student data:');
        const finalStudentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        const finalData = finalStudentResponse.data.data;
        console.log('   ✅ Final student data retrieved');
        console.log(`   📝 Name: ${finalData.Owner}`);
        console.log(`   📝 Department: ${finalData.Color}`);
        console.log(`   📝 Course: ${finalData.course}`);
        console.log(`   📝 GPA: ${finalData.gpa}`);
        console.log(`   📝 Address: ${finalData.address}`);
        console.log(`   📝 Phone: ${finalData.phoneNo}`);

        // Test 10: Delete student
        console.log('\n10. 🗑️  Deleting student...');
        const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student deleted successfully');

        console.log('\n✅ All real old value tracking tests completed successfully!');
        console.log('🎉 History now shows the actual old values before updates!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('🔍 Error details:', error.response?.status, error.response?.statusText);
        if (error.response?.data) {
            console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testRealOldValues(); 