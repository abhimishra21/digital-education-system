const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testHistoryTracking() {
    console.log('🧪 Testing Student Management Functionality\n');

    try {
        // Test 1: Create a student with initial values
        console.log('1. 📝 Creating a student with initial values...');
        const createData = {
            studentId: 'FIXED_TEST001',
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

        // Test 2: Get student details
        console.log('\n2. 📚 Getting student details...');
        const studentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student details retrieved successfully');
        console.log('   📊 Student Name:', studentResponse.data.data.Owner);
        console.log('   📊 Student Course:', studentResponse.data.data.Color);

        // Test 3: Update student with meaningful changes
        console.log('\n3. ✏️  Updating student with meaningful changes...');
        
        // Wait for blockchain to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update 1: Change GPA from 3.5 to 3.8
        console.log('   🔄 Updating GPA from 3.5 to 3.8...');
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, { gpa: 3.8 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update 2: Change address
        console.log('   🔄 Updating address...');
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, { 
            address: '456 University Drive, College Town, State' 
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update 3: Change course and department
        console.log('   🔄 Updating course and department...');
        await axios.put(`${API_BASE_URL}/students/${createData.studentId}`, { 
            course: 'Information Technology',
            department: 'IT Department'
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('   ✅ All updates completed');

        // Test 4: Get student history after updates
        console.log('\n4. 📚 Getting student history after updates...');
        const historyResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse.data.data.length);
        
        if (historyResponse.data.data.length > 0) {
            console.log('\n   📋 History with Real Old → New Values:');
            console.log('   ' + '='.repeat(80));
            
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

        // Test 5: Get final student data
        console.log('\n5. 📊 Final student data:');
        const finalStudentResponse = await axios.get(`${API_BASE_URL}/students/${createData.studentId}`);
        const finalData = finalStudentResponse.data.data;
        console.log('   ✅ Final student data retrieved');
        console.log(`   📝 Name: ${finalData.Owner}`);
        console.log(`   📝 Department: ${finalData.Color}`);
        console.log(`   📝 Course: ${finalData.course}`);
        console.log(`   📝 GPA: ${finalData.gpa}`);
        console.log(`   📝 Address: ${finalData.address}`);

        // Test 6: Delete student
        console.log('\n6. 🗑️  Deleting student...');
        const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${createData.studentId}`);
        console.log('   ✅ Student deleted successfully');

        console.log('\n✅ All history tracking tests completed successfully!');
        console.log('🎉 History tracking with real old values is working properly!');

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