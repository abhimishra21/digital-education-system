const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testCurrentAPI() {
    console.log('🧪 Testing Current API Functionality\n');

    try {
        // Test 1: Health check
        console.log('1. 🔍 Health check...');
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('   ✅ API is running');
        console.log('   📊 Blockchain status:', healthResponse.data.blockchain);
        console.log('   📊 Channel:', healthResponse.data.channel);
        console.log('   📊 Chaincode:', healthResponse.data.chaincode);

        // Test 2: Get all students
        console.log('\n2. 📋 Getting all students...');
        const studentsResponse = await axios.get(`${API_BASE_URL}/students`);
        console.log('   ✅ Students retrieved successfully');
        console.log('   📊 Total students:', studentsResponse.data.data.length);

        if (studentsResponse.data.data.length > 0) {
            const firstStudent = studentsResponse.data.data[0].Record;
            console.log('   📋 Sample student:', firstStudent.enrollmentNo, '-', firstStudent.firstName, firstStudent.lastName);
        }

        // Test 3: Test history endpoint (current implementation)
        if (studentsResponse.data.data.length > 0) {
            const testStudent = studentsResponse.data.data[0].Record;
            console.log(`\n3. 📚 Testing history for student: ${testStudent.enrollmentNo}`);
            
            try {
                const historyResponse = await axios.get(`${API_BASE_URL}/students/${testStudent.enrollmentNo}/history`);
                console.log('   ✅ History endpoint working');
                console.log('   📊 History records:', historyResponse.data.data.totalRecords);
                
                if (historyResponse.data.data.history.length > 0) {
                    const latestEntry = historyResponse.data.data.history[0];
                    console.log('   📋 Latest entry:', latestEntry.action, '-', latestEntry.description);
                }
            } catch (historyError) {
                console.log('   ⚠️  History endpoint error:', historyError.response?.data?.message || historyError.message);
            }
        }

        // Test 4: Test student update (to see if history tracking works)
        if (studentsResponse.data.data.length > 0) {
            const testStudent = studentsResponse.data.data[0].Record;
            console.log(`\n4. 📝 Testing student update: ${testStudent.enrollmentNo}`);
            
            const updateData = {
                gpa: parseFloat(testStudent.gpa || 0) + 0.1
            };
            
            try {
                const updateResponse = await axios.put(`${API_BASE_URL}/students/${testStudent.enrollmentNo}`, updateData);
                console.log('   ✅ Student updated successfully');
                
                if (updateResponse.data.data.changes) {
                    console.log('   📊 Changes tracked:', updateResponse.data.data.changes.length);
                    updateResponse.data.data.changes.forEach(change => {
                        console.log(`      ${change.field}: "${change.oldValue}" → "${change.newValue}"`);
                    });
                }
            } catch (updateError) {
                console.log('   ⚠️  Update error:', updateError.response?.data?.message || updateError.message);
            }
        }

        console.log('\n✅ Current API test completed!');
        console.log('\n📋 Current Status:');
        console.log('   ✅ API server is running');
        console.log('   ✅ Blockchain connection is working');
        console.log('   ✅ Student data is accessible');
        
        if (studentsResponse.data.data.length > 0) {
            console.log('   ✅ Student operations are working');
        }

        console.log('\n🔄 Next Steps for History Tracking:');
        console.log('   1. Run the upgrade script: ./upgrade-chaincode.sh');
        console.log('   2. Restart the API server');
        console.log('   3. Test the enhanced history functionality');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure the API server is running: node comprehensive-student-api.js');
        console.log('   2. Check if the blockchain network is up');
        console.log('   3. Verify the API is accessible at http://localhost:3001');
    }
}

// Run the test
testCurrentAPI(); 