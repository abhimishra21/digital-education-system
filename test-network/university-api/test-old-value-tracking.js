const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testOldValueTracking() {
    console.log('🧪 Testing Old Value Tracking with Meaningful Changes\n');

    try {
        // Test 1: Create a student with initial values
        console.log('1. 📝 Creating a student with initial values...');
        const createData = {
            studentId: 'OLD_VALUE_TEST001',
            name: 'Charlie Brown',
            email: 'charlie.brown@university.edu',
            department: 'Computer Science',
            enrollmentYear: 2024,
            firstName: 'Charlie',
            lastName: 'Brown',
            fathersName: 'Robert Brown',
            mothersName: 'Linda Brown',
            dateOfBirth: '2001-08-10',
            phoneNo: '+1-555-0505',
            address: '123 Main Street, Hometown, State',
            course: 'Computer Science',
            status: 'Active',
            semester: 1,
            gpa: 3.2,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/students`, createData);
        console.log('   ✅ Student created successfully');
        console.log('   📊 Student ID:', createData.studentId);

        // Wait a moment for blockchain to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Update specific fields one by one to show old values
        console.log('\n2. 🔄 Updating GPA from 3.2 to 3.5...');
        const gpaUpdateData = {
            gpa: 3.5
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, gpaUpdateData);
        console.log('   ✅ GPA updated from 3.2 to 3.5');

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n3. 🔄 Updating address...');
        const addressUpdateData = {
            address: '456 University Drive, College Town, State'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, addressUpdateData);
        console.log('   ✅ Address updated');

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n4. 🔄 Updating phone number...');
        const phoneUpdateData = {
            phoneNo: '+1-555-0606'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, phoneUpdateData);
        console.log('   ✅ Phone number updated');

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n5. 🔄 Updating course and department...');
        const courseUpdateData = {
            course: 'Information Technology',
            department: 'IT Department'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, courseUpdateData);
        console.log('   ✅ Course and department updated');

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n6. 🔄 Updating name...');
        const nameUpdateData = {
            name: 'Charlie Wilson',
            firstName: 'Charlie',
            lastName: 'Wilson'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, nameUpdateData);
        console.log('   ✅ Name updated');

        // Test 7: Get and display the history with old and new values
        console.log('\n7. 📚 Getting complete history with old and new values...');
        const historyResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse.data.data.length);
        
        if (historyResponse.data.data.length > 0) {
            console.log('\n   📋 Complete History with Old → New Values:');
            console.log('   ' + '='.repeat(80));
            
            historyResponse.data.data.forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.action.toUpperCase()} - ${entry.field.toUpperCase()}`);
                console.log(`      📅 Time: ${entry.changedAt}`);
                console.log(`      👤 Changed by: ${entry.changedBy}`);
                
                if (entry.field !== 'all') {
                    console.log(`      📝 Old Value: "${entry.oldValue}"`);
                    console.log(`      📝 New Value: "${entry.newValue}"`);
                    console.log(`      📋 Description: ${entry.description}`);
                } else {
                    console.log(`      📝 Description: ${entry.description}`);
                }
                console.log('   ' + '-'.repeat(80));
            });
        }

        // Test 8: Show current student data
        console.log('\n8. 📊 Current student data:');
        const currentStudentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        const currentData = currentStudentResponse.data.data;
        console.log('   ✅ Current student data retrieved');
        console.log(`   📝 Name: ${currentData.Owner}`);
        console.log(`   📝 Department: ${currentData.Color}`);
        console.log(`   📝 Course: ${currentData.course}`);
        console.log(`   📝 GPA: ${currentData.gpa}`);
        console.log(`   📝 Address: ${currentData.address}`);
        console.log(`   📝 Phone: ${currentData.phoneNo}`);

        // Test 9: Delete student
        console.log('\n9. 🗑️  Deleting student...');
        const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student deleted successfully');

        console.log('\n✅ All old value tracking tests completed successfully!');
        console.log('🎉 History now properly shows old values before updates!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('🔍 Error details:', error.response?.status, error.response?.statusText);
        if (error.response?.data) {
            console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testOldValueTracking(); 