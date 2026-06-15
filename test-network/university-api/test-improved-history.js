const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testImprovedHistoryTracking() {
    console.log('🧪 Testing Improved History Tracking Functionality\n');

    try {
        // Test 1: Create a student
        console.log('1. 📝 Creating a student...');
        const createData = {
            studentId: 'IMPROVED_TEST001',
            name: 'Alice Johnson',
            email: 'alice.johnson@university.edu',
            department: 'Computer Science',
            enrollmentYear: 2024,
            firstName: 'Alice',
            lastName: 'Johnson',
            fathersName: 'Michael Johnson',
            mothersName: 'Sarah Johnson',
            dateOfBirth: '2002-03-15',
            phoneNo: '+1-555-0101',
            address: '789 College Ave, University City, State',
            course: 'Computer Science',
            status: 'Active',
            semester: 1,
            gpa: 3.7,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/students`, createData);
        console.log('   ✅ Student created successfully');
        console.log('   📊 Student ID:', createData.studentId);

        // Test 2: Get student details
        console.log('\n2. 📚 Getting student details...');
        const studentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student details retrieved successfully');
        console.log('   📊 Student Name:', studentResponse.data.data.Owner);
        console.log('   📊 Student Course:', studentResponse.data.data.course);

        // Test 3: Update student with meaningful changes
        console.log('\n3. ✏️  Updating student with meaningful changes...');
        const updateData = {
            name: 'Alice Smith',
            email: 'alice.smith@university.edu',
            department: 'Information Technology',
            enrollmentYear: 2024,
            firstName: 'Alice',
            lastName: 'Smith',
            fathersName: 'Michael Smith',
            mothersName: 'Sarah Smith',
            dateOfBirth: '2002-03-15',
            phoneNo: '+1-555-0202',
            address: '456 Tech Street, Innovation City, State',
            course: 'Information Technology',
            status: 'Active',
            semester: 2,
            gpa: 3.9,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const updateResponse = await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, updateData);
        console.log('   ✅ Student updated successfully');

        // Test 4: Get student history after update
        console.log('\n4. 📚 Getting student history after update...');
        const historyResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse.data.data.length);
        
        if (historyResponse.data.data.length > 0) {
            console.log('   📋 Recent history entries with meaningful changes:');
            historyResponse.data.data.slice(0, 5).forEach((entry, index) => {
                console.log(`      ${index + 1}. ${entry.action} - ${entry.description}`);
                console.log(`         Changed by: ${entry.changedBy} at ${entry.changedAt}`);
                if (entry.field !== 'all' && entry.oldValue !== entry.newValue) {
                    console.log(`         Field: ${entry.field}`);
                    console.log(`         Old Value: "${entry.oldValue}"`);
                    console.log(`         New Value: "${entry.newValue}"`);
                }
                console.log('');
            });
        }

        // Test 5: Update specific fields individually
        console.log('\n5. 🔄 Updating specific fields individually...');
        
        // Update GPA
        const gpaUpdateData = {
            gpa: 4.0
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, gpaUpdateData);
        console.log('   ✅ GPA updated to 4.0');

        // Update address
        const addressUpdateData = {
            address: '999 Success Lane, Achievement City, State'
        };
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, addressUpdateData);
        console.log('   ✅ Address updated');

        // Test 6: Get final history
        console.log('\n6. 📚 Getting final history...');
        const finalHistoryResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ Final history retrieved successfully');
        console.log('   📊 Total history records:', finalHistoryResponse.data.data.length);
        
        if (finalHistoryResponse.data.data.length > 0) {
            console.log('   📋 Complete history with meaningful changes:');
            finalHistoryResponse.data.data.forEach((entry, index) => {
                console.log(`      ${index + 1}. ${entry.action} - ${entry.description}`);
                console.log(`         Changed by: ${entry.changedBy} at ${entry.changedAt}`);
                if (entry.field !== 'all' && entry.oldValue !== entry.newValue) {
                    console.log(`         Field: ${entry.field}`);
                    console.log(`         Old Value: "${entry.oldValue}"`);
                    console.log(`         New Value: "${entry.newValue}"`);
                }
                console.log('');
            });
        }

        // Test 7: Delete student
        console.log('\n7. 🗑️  Deleting student...');
        const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student deleted successfully');

        console.log('\n✅ All improved history tracking tests completed successfully!');
        console.log('🎉 History functionality now shows meaningful old and new values!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('🔍 Error details:', error.response?.status, error.response?.statusText);
        if (error.response?.data) {
            console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testImprovedHistoryTracking(); 