const { exec } = require('child_process');

const BASE_URL = 'http://localhost:3002/api';

const urls = [
    {
        name: 'Health Check',
        url: `${BASE_URL}/health`,
        description: 'Check if the API is running and blockchain is connected'
    },
    {
        name: 'All Students',
        url: `${BASE_URL}/students`,
        description: 'Get all student records'
    },
    {
        name: 'All Assets',
        url: `${BASE_URL}/assets`,
        description: 'Get all assets (including history records)'
    },
    {
        name: 'Student History',
        url: `${BASE_URL}/students/HISTORY_TEST001/history`,
        description: 'Get history for a specific student'
    },
    {
        name: 'Specific Student',
        url: `${BASE_URL}/students/HISTORY_TEST001`,
        description: 'Get details for a specific student'
    }
];

async function checkUrl(name, url, description) {
    return new Promise((resolve) => {
        console.log(`\n🔍 ${name}`);
        console.log(`📋 Description: ${description}`);
        console.log(`🌐 URL: ${url}`);
        console.log('📊 Response:');
        
        exec(`curl -s "${url}"`, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Error: ${error.message}`);
            } else {
                try {
                    const data = JSON.parse(stdout);
                    console.log(JSON.stringify(data, null, 2));
                } catch (e) {
                    console.log(stdout);
                }
            }
            console.log('─'.repeat(80));
            resolve();
        });
    });
}

async function checkAllUrls() {
    console.log('🌐 Checking API URLs\n');
    console.log('='.repeat(80));
    
    for (const urlInfo of urls) {
        await checkUrl(urlInfo.name, urlInfo.url, urlInfo.description);
    }
    
    console.log('\n✅ All URL checks completed!');
    console.log('\n📝 You can also visit these URLs in your browser:');
    urls.forEach(urlInfo => {
        console.log(`   🔗 ${urlInfo.name}: ${urlInfo.url}`);
    });
}

// Run the checks
checkAllUrls(); 