const API_BASE_URL = 'http://localhost:3001/api';

async function clearAllStudentData() {
  console.log('🚀 Starting to clear all student data from blockchain...');
  
  try {
    // First, get all students
    console.log('📋 Fetching all students...');
    const response = await fetch(`${API_BASE_URL}/students`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Failed to fetch students: ${data.message}`);
    }
    
    const students = data.data;
    console.log(`📊 Found ${students.length} students to delete`);
    
    if (students.length === 0) {
      console.log('✅ No students found. Database is already empty.');
      return;
    }
    
    // Delete each student one by one
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const student of students) {
      try {
        const enrollmentNo = student.Record ? student.Record.enrollmentNo : student.enrollmentNo;
        console.log(`🗑️  Deleting student: ${enrollmentNo}`);
        
        const deleteResponse = await fetch(`${API_BASE_URL}/students/${enrollmentNo}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const deleteData = await deleteResponse.json();
        
        if (deleteData.success) {
          deletedCount++;
          console.log(`✅ Successfully deleted: ${enrollmentNo}`);
        } else {
          failedCount++;
          console.error(`❌ Failed to delete ${enrollmentNo}: ${deleteData.message}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ Error deleting student:`, error);
      }
    }
    
    console.log('\n📈 Deletion Summary:');
    console.log(`✅ Successfully deleted: ${deletedCount} students`);
    console.log(`❌ Failed to delete: ${failedCount} students`);
    console.log(`📊 Total processed: ${students.length} students`);
    
    if (deletedCount > 0) {
      console.log('\n🎉 Database cleared successfully!');
      console.log('You can now start fresh with new student entries.');
    } else {
      console.log('\n⚠️  No students were deleted. Please check the API connection.');
    }
    
  } catch (error) {
    console.error('💥 Error clearing data:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the API server is running on http://localhost:3001');
    console.log('2. Check if the blockchain network is up');
    console.log('3. Verify the API endpoints are accessible');
  }
}

// Run the function
clearAllStudentData(); 