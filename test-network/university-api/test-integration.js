const axios = require('axios');

async function testIntegration() {
    console.log('🔍 Testing University API Integration...\n');

    try {
        // Test backend directly
        console.log('1. Testing Backend API (port 3000)...');
        const backendResponse = await axios.get('http://localhost:3000/api/health');
        console.log('✅ Backend Status:', backendResponse.data);
        
        // Test frontend proxy
        console.log('\n2. Testing Frontend Proxy (port 3001)...');
        const frontendResponse = await axios.get('http://localhost:3001/api/health');
        console.log('✅ Frontend Proxy Status:', frontendResponse.data);
        
        // Test assets endpoint
        console.log('\n3. Testing Assets Endpoint...');
        const assetsResponse = await axios.get('http://localhost:3000/api/assets');
        const assets = assetsResponse.data.data;
        
        const students = assets.filter(asset => asset.ID.startsWith('STUDENT_'));
        const faculty = assets.filter(asset => asset.ID.startsWith('FACULTY_'));
        const courses = assets.filter(asset => asset.ID.startsWith('COURSE_'));
        
        console.log(`✅ Total Assets: ${assets.length}`);
        console.log(`✅ Students: ${students.length}`);
        console.log(`✅ Faculty: ${faculty.length}`);
        console.log(`✅ Courses: ${courses.length}`);
        
        // Show sample data
        if (students.length > 0) {
            console.log('\n📚 Sample Student:', students[0]);
        }
        if (faculty.length > 0) {
            console.log('\n👨‍🏫 Sample Faculty:', faculty[0]);
        }
        if (courses.length > 0) {
            console.log('\n📖 Sample Course:', courses[0]);
        }
        
        console.log('\n🎉 Integration Test Successful!');
        console.log('🌐 Frontend: http://localhost:3001');
        console.log('🔗 Backend: http://localhost:3000');
        console.log('📊 Health Check: http://localhost:3000/api/health');
        
    } catch (error) {
        console.error('❌ Integration Test Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testIntegration(); 