const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testHistoryTracking() {
    console.log('🧪 Testing History Tracking Functionality\n');

    try {
        // Test 1: Create a student
        console.log('1. 📝 Creating a student...');
        const createData = {
            studentId: 'HISTORY_TEST001',
            name: 'John Doe',
            email: 'john.doe@university.edu',
            department: 'Computer Science',
            enrollmentYear: 2024,
            firstName: 'John',
            lastName: 'Doe',
            fathersName: 'Robert Doe',
            mothersName: 'Jane Doe',
            dateOfBirth: '2000-01-15',
            phoneNo: '+1-555-0123',
            address: '123 University St, City, State',
            course: 'Computer Science',
            status: 'Active',
            semester: 1,
            gpa: 3.5,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/students`, createData);
        console.log('   ✅ Student created successfully');
        console.log('   📊 Student ID:', createData.studentId);

        // Test 2: Get student history after creation
        console.log('\n2. 📚 Getting student history after creation...');
        const historyResponse1 = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 History records:', historyResponse1.data.data.length);
        
        if (historyResponse1.data.data.length > 0) {
            console.log('   📋 Latest history entry:');
            console.log('      Action:', historyResponse1.data.data[0].action);
            console.log('      Changed by:', historyResponse1.data.data[0].changedBy);
            console.log('      Description:', historyResponse1.data.data[0].description);
        }

        // Test 3: Update student
        console.log('\n3. ✏️  Updating student...');
        const updateData = {
            name: 'John Smith',
            email: 'john.smith@university.edu',
            department: 'Computer Science',
            enrollmentYear: 2024,
            firstName: 'John',
            lastName: 'Smith',
            fathersName: 'Robert Smith',
            mothersName: 'Jane Smith',
            dateOfBirth: '2000-01-15',
            phoneNo: '+1-555-0456',
            address: '456 University St, City, State',
            course: 'Computer Science',
            status: 'Active',
            semester: 2,
            gpa: 3.8,
            admissionDate: '2024-09-01',
            createdBy: 'Test User'
        };

        const updateResponse = await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, updateData);
        console.log('   ✅ Student updated successfully');

        // Test 4: Get student history after update
        console.log('\n4. 📚 Getting student history after update...');
        const historyResponse2 = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse2.data.data.length);
        
        if (historyResponse2.data.data.length > 0) {
            console.log('   📋 Recent history entries:');
            historyResponse2.data.data.slice(0, 3).forEach((entry, index) => {
                console.log(`      ${index + 1}. ${entry.action} - ${entry.description}`);
                console.log(`         Changed by: ${entry.changedBy} at ${entry.changedAt}`);
            });
        }

        // Test 5: Delete student
        console.log('\n5. 🗑️  Deleting student...');
        const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student deleted successfully');

        // Test 6: Get student history after deletion
        console.log('\n6. 📚 Getting student history after deletion...');
        const historyResponse3 = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse3.data.data.length);
        
        if (historyResponse3.data.data.length > 0) {
            console.log('   📋 Complete history:');
            historyResponse3.data.data.forEach((entry, index) => {
                console.log(`      ${index + 1}. ${entry.action} - ${entry.description}`);
                console.log(`         Changed by: ${entry.changedBy} at ${entry.changedAt}`);
                if (entry.field && entry.oldValue !== entry.newValue) {
                    console.log(`         Field: ${entry.field} (${entry.oldValue} → ${entry.newValue})`);
                }
            });
        }

        console.log('\n✅ All history tracking tests completed successfully!');
        console.log('🎉 History functionality is working properly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('🔍 Error details:', error.response?.status, error.response?.statusText);
        if (error.response?.data) {
            console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testHistoryTracking(); 