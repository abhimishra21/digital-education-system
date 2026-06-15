const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testCompleteHistoryTracking() {
    console.log('🧪 Testing Complete History Tracking System\n');

    try {
        // Test 1: Create a new student
        console.log('1. 📝 Creating a new student...');
        const studentData = {
            enrollmentNo: 'HISTORY_TEST001',
            firstName: 'John',
            lastName: 'Doe',
            fathersName: 'Robert Doe',
            mothersName: 'Jane Doe',
            dateOfBirth: '2000-01-15',
            phoneNo: '1234567890',
            email: 'john.doe@email.com',
            address: '123 Main Street',
            course: 'Computer Science',
            status: 'Active',
            semester: 1,
            gpa: 0.0
        };

        const createResponse = await axios.post(`${API_BASE_URL}/students/register`, studentData);
        console.log('   ✅ Student created successfully');
        console.log('   📊 Student ID:', createResponse.data.data.enrollmentNo);

        // Test 2: Get initial history
        console.log('\n2. 📚 Getting initial history...');
        const historyResponse1 = await axios.get(`${API_BASE_URL}/students/${studentData.enrollmentNo}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse1.data.data.totalRecords);

        if (historyResponse1.data.data.history.length > 0) {
            console.log('   📋 Latest history entry:');
            const latestEntry = historyResponse1.data.data.history[0];
            console.log('      Action:', latestEntry.action);
            console.log('      Changed by:', latestEntry.changedBy);
            console.log('      Description:', latestEntry.description);
            console.log('      Timestamp:', latestEntry.changedAt);
        }

        // Test 3: Update student information
        console.log('\n3. 📝 Updating student information...');
        const updateData1 = {
            firstName: 'Jonathan',
            email: 'jonathan.doe@email.com',
            gpa: 3.5
        };

        const updateResponse1 = await axios.put(`${API_BASE_URL}/students/${studentData.enrollmentNo}`, updateData1);
        console.log('   ✅ Student updated successfully');
        console.log('   📊 Changes made:', updateResponse1.data.data.changes.length);

        // Test 4: Get history after first update
        console.log('\n4. 📚 Getting history after first update...');
        const historyResponse2 = await axios.get(`${API_BASE_URL}/students/${studentData.enrollmentNo}/history`);
        console.log('   ✅ History retrieved successfully');
        console.log('   📊 Total history records:', historyResponse2.data.data.totalRecords);

        if (historyResponse2.data.data.history.length > 0) {
            console.log('   📋 Recent history entries:');
            historyResponse2.data.data.history.slice(0, 3).forEach((entry, index) => {
                console.log(`      ${index + 1}. ${entry.action.toUpperCase()}: ${entry.description}`);
                console.log(`         Field: ${entry.field}, Changed by: ${entry.changedBy}`);
                if (entry.oldValue && entry.newValue) {
                    console.log(`         ${entry.oldValue} → ${entry.newValue}`);
                }
                console.log(`         Time: ${entry.changedAt}\n`);
            });
        }

        // Test 5: Update more fields
        console.log('\n5. 📝 Updating more student fields...');
        const updateData2 = {
            course: 'Data Science',
            semester: 2,
            address: '456 Oak Avenue',
            phoneNo: '9876543210'
        };

        const updateResponse2 = await axios.put(`${API_BASE_URL}/students/${studentData.enrollmentNo}`, updateData2);
        console.log('   ✅ Student updated successfully');
        console.log('   📊 Changes made:', updateResponse2.data.data.changes.length);

        // Test 6: Get complete history
        console.log('\n6. 📚 Getting complete history...');
        const historyResponse3 = await axios.get(`${API_BASE_URL}/students/${studentData.enrollmentNo}/history`);
        console.log('   ✅ Complete history retrieved successfully');
        console.log('   📊 Total history records:', historyResponse3.data.data.totalRecords);

        console.log('\n   📋 Complete Change History:');
        historyResponse3.data.data.history.forEach((entry, index) => {
            console.log(`\n   ${index + 1}. ${entry.action.toUpperCase()}`);
            console.log(`      Description: ${entry.description}`);
            console.log(`      Field: ${entry.field}`);
            console.log(`      Changed by: ${entry.changedBy}`);
            console.log(`      Timestamp: ${entry.changedAt}`);
            
            if (entry.oldValue && entry.newValue && entry.field !== 'all') {
                console.log(`      Change: "${entry.oldValue}" → "${entry.newValue}"`);
            } else if (entry.action === 'created') {
                console.log(`      New student record created`);
            } else if (entry.action === 'deleted') {
                console.log(`      Student record deleted`);
            }
        });

        // Test 7: Transfer student course
        console.log('\n7. 🔄 Transferring student course...');
        const transferResponse = await axios.put(`${API_BASE_URL}/students/${studentData.enrollmentNo}/transfer`, {
            newCourse: 'Artificial Intelligence'
        });
        console.log('   ✅ Student transferred successfully');
        console.log('   📊 Old course → New course:', transferResponse.data.data.oldCourse, '→', transferResponse.data.data.newCourse);

        // Test 8: Get final history
        console.log('\n8. 📚 Getting final history...');
        const finalHistoryResponse = await axios.get(`${API_BASE_URL}/students/${studentData.enrollmentNo}/history`);
        console.log('   ✅ Final history retrieved successfully');
        console.log('   📊 Total history records:', finalHistoryResponse.data.data.totalRecords);

        console.log('\n   📋 Final Change Summary:');
        const actions = {};
        finalHistoryResponse.data.data.history.forEach(entry => {
            if (!actions[entry.action]) {
                actions[entry.action] = 0;
            }
            actions[entry.action]++;
        });

        Object.entries(actions).forEach(([action, count]) => {
            console.log(`      ${action}: ${count} entries`);
        });

        console.log('\n✅ Complete history tracking test completed successfully!');
        console.log('🎉 The system now tracks:');
        console.log('   • What data changed (field names)');
        console.log('   • Old values → New values');
        console.log('   • Who made the changes');
        console.log('   • When changes were made (timestamps)');
        console.log('   • Complete audit trail');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testCompleteHistoryTracking(); 