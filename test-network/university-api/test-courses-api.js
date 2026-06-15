const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testCoursesAPI() {
    console.log('🔍 Testing Courses API...\n');

    try {
        // 1. Get all courses
        console.log('1. Getting all courses...');
        const getAllResponse = await axios.get(`${API_BASE_URL}/courses`);
        console.log('✅ All courses:', getAllResponse.data);
        console.log(`   Total courses: ${getAllResponse.data.data.length}\n`);

        // 2. Create a new course
        console.log('2. Creating a new course...');
        const newCourse = {
            courseId: 'ME301',
            title: 'Thermodynamics',
            description: 'Principles of thermodynamics and heat transfer',
            department: 'Mechanical Engineering',
            credits: 3,
            instructor: 'Dr. Michael Brown',
            semester: 'Spring 2024'
        };
        
        const createResponse = await axios.post(`${API_BASE_URL}/courses`, newCourse);
        console.log('✅ Course created:', createResponse.data);

        // 3. Get the specific course
        console.log('\n3. Getting specific course...');
        const getCourseResponse = await axios.get(`${API_BASE_URL}/courses/ME301`);
        console.log('✅ Course details:', getCourseResponse.data);

        // 4. Update the course
        console.log('\n4. Updating course...');
        const updateData = {
            title: 'Advanced Thermodynamics',
            description: 'Advanced principles of thermodynamics and heat transfer',
            department: 'Mechanical Engineering',
            credits: 4,
            instructor: 'Dr. Michael Brown',
            semester: 'Spring 2024'
        };
        
        const updateResponse = await axios.put(`${API_BASE_URL}/courses/ME301`, updateData);
        console.log('✅ Course updated:', updateResponse.data);

        // 5. Get all courses again to see the changes
        console.log('\n5. Getting all courses after update...');
        const getAllAfterUpdate = await axios.get(`${API_BASE_URL}/courses`);
        console.log('✅ Updated courses list:', getAllAfterUpdate.data);
        console.log(`   Total courses: ${getAllAfterUpdate.data.data.length}`);

        // 6. Test blockchain integration
        console.log('\n6. Testing blockchain integration...');
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Blockchain status:', healthResponse.data);

        // 7. Test error handling - try to get non-existent course
        console.log('\n7. Testing error handling...');
        try {
            await axios.get(`${API_BASE_URL}/courses/NONEXISTENT`);
        } catch (error) {
            console.log('✅ Error handled correctly:', error.response.data);
        }

        console.log('\n🎉 Courses API Test Completed Successfully!');
        console.log('📚 Courses API Endpoints:');
        console.log('   GET    /api/courses - Get all courses');
        console.log('   POST   /api/courses - Create new course');
        console.log('   GET    /api/courses/:id - Get specific course');
        console.log('   PUT    /api/courses/:id - Update course');
        console.log('   DELETE /api/courses/:id - Delete course');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testCoursesAPI(); 