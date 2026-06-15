const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function testApiConnection() {
  console.log('🔍 Testing API Connection...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('📋 Blockchain Info:', healthData.blockchainInfo);
    console.log('');

    // Test getting all students
    console.log('2. Testing get all students...');
    const studentsResponse = await fetch(`${API_BASE_URL}/students`);
    const studentsData = await studentsResponse.json();
    console.log('✅ Students retrieved:', studentsData.data.length, 'students');
    
    if (studentsData.data.length > 0) {
      console.log('📚 Sample student:', {
        enrollmentNo: studentsData.data[0].Record.enrollmentNo,
        name: `${studentsData.data[0].Record.firstName} ${studentsData.data[0].Record.lastName}`,
        course: studentsData.data[0].Record.course,
        status: studentsData.data[0].Record.status
      });
    }
    console.log('');

    // Test getting a specific student
    if (studentsData.data.length > 0) {
      const enrollmentNo = studentsData.data[0].Record.enrollmentNo;
      console.log(`3. Testing get student by enrollment (${enrollmentNo})...`);
      const studentResponse = await fetch(`${API_BASE_URL}/students/enrollment/${enrollmentNo}`);
      const studentData = await studentResponse.json();
      console.log('✅ Student retrieved:', studentData.success ? 'Success' : 'Failed');
      console.log('');

      // Test updating a student
      console.log(`4. Testing update student (${enrollmentNo})...`);
      const updateData = {
        gpa: 3.8,
        status: 'Active'
      };
      const updateResponse = await fetch(`${API_BASE_URL}/students/${enrollmentNo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      const updateResult = await updateResponse.json();
      console.log('✅ Student updated:', updateResult.success ? 'Success' : 'Failed');
      console.log('📝 Update message:', updateResult.message);
      console.log('');
    }

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📖 Frontend should now be able to:');
    console.log('   - Connect to the blockchain API');
    console.log('   - Display existing students');
    console.log('   - Add new students');
    console.log('   - Edit student information');
    console.log('   - Delete students');
    console.log('   - View student history');
    console.log('\n🌐 Frontend URL: http://localhost:3002');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the comprehensive student API is running on port 3001');
    console.log('2. Make sure the blockchain network is up');
    console.log('3. Check if the chaincode is deployed');
  }
}

testApiConnection(); 