const express = require('express');
const cors = require('cors');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Configuration
const channelName = 'university';
const chaincodeName = 'exam-management';
const mspId = 'Org1MSP';

// Paths to crypto materials
const cryptoPath = path.resolve(__dirname, '../organizations/peerOrganizations/org1.example.com');
const keyDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');

// Network configuration
const peerEndpoint = 'localhost:7051';
const peerHostAlias = 'peer0.org1.example.com';

const utf8Decoder = new TextDecoder();

// Helper functions
async function newGrpcConnection() {
    try {
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
            'grpc.keepalive_time_ms': 120000,
            'grpc.keepalive_timeout_ms': 20000,
            'grpc.keepalive_permit_without_calls': true,
            'grpc.http2.max_pings_without_data': 0,
            'grpc.http2.min_time_between_pings_ms': 120000,
            'grpc.http2.min_ping_interval_without_data_ms': 300000,
        });
    } catch (error) {
        console.error('Error creating gRPC connection:', error);
        throw error;
    }
}

async function newIdentity() {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner() {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getFirstDirFileName(dirPath) {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

// Initialize blockchain connection
let gateway, network, contract;

async function initializeBlockchain() {
    try {
        const client = await newGrpcConnection();
        gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        network = gateway.getNetwork(channelName);
        contract = network.getContract(chaincodeName);
        
        console.log('✅ Test Blockchain connection established');
        console.log(`📋 Connected to chaincode: ${chaincodeName}`);
    } catch (error) {
        console.error('❌ Blockchain connection failed:', error);
        throw error;
    }
}

// Test Functions

async function testGetAllExams() {
    try {
        console.log('\n🧪 Testing GetAllExams...');
        const result = await contract.evaluate('GetAllExams');
        const exams = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ GetAllExams: Found ${exams.length} exams`);
        return { success: true, count: exams.length, data: exams };
    } catch (error) {
        console.error(`❌ GetAllExams failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testGetExamById() {
    try {
        console.log('\n🧪 Testing GetExamById...');
        const result = await contract.evaluate('GetExamById', 'EXAM2024001');
        const exam = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ GetExamById: Found exam ${exam.examId}`);
        return { success: true, data: exam };
    } catch (error) {
        console.error(`❌ GetExamById failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testGetExamsByCourse() {
    try {
        console.log('\n🧪 Testing GetExamsByCourse...');
        const result = await contract.evaluate('GetExamsByCourse', 'CS101');
        const exams = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ GetExamsByCourse: Found ${exams.length} exams for CS101`);
        return { success: true, count: exams.length, data: exams };
    } catch (error) {
        console.error(`❌ GetExamsByCourse failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testSearchExams() {
    try {
        console.log('\n🧪 Testing SearchExams...');
        const searchCriteria = { courseCode: 'CS101', examType: 'Theory' };
        const result = await contract.evaluate('SearchExams', JSON.stringify(searchCriteria));
        const exams = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ SearchExams: Found ${exams.length} exams matching criteria`);
        return { success: true, count: exams.length, data: exams };
    } catch (error) {
        console.error(`❌ SearchExams failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testGetExamStatistics() {
    try {
        console.log('\n🧪 Testing GetExamStatistics...');
        const result = await contract.evaluate('GetExamStatistics');
        const stats = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ GetExamStatistics: Generated statistics for ${stats.totalExams} exams`);
        return { success: true, data: stats };
    } catch (error) {
        console.error(`❌ GetExamStatistics failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testGetExamFieldHistory() {
    try {
        console.log('\n🧪 Testing GetExamFieldHistory...');
        const result = await contract.evaluate('GetExamFieldHistory', 'EXAM2024001');
        const history = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ GetExamFieldHistory: Retrieved history for exam ${history.examId}`);
        return { success: true, data: history };
    } catch (error) {
        console.error(`❌ GetExamFieldHistory failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testGetCustomFieldsSchema() {
    try {
        console.log('\n🧪 Testing GetCustomFieldsSchema...');
        const result = await contract.evaluate('GetCustomFieldsSchema');
        const schema = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ GetCustomFieldsSchema: Generated schema with ${Object.keys(schema.customFields).length} custom fields`);
        return { success: true, data: schema };
    } catch (error) {
        console.error(`❌ GetCustomFieldsSchema failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testValidateExamData() {
    try {
        console.log('\n🧪 Testing ValidateExamData...');
        const examData = {
            examId: 'TEST001',
            examName: 'Test Exam',
            courseCode: 'TEST101',
            duration: 60,
            totalMarks: 50,
            passingMarks: 25
        };
        const result = await contract.evaluate('ValidateExamData', JSON.stringify(examData));
        const validation = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ ValidateExamData: Validation completed, isValid: ${validation.isValid}`);
        return { success: true, data: validation };
    } catch (error) {
        console.error(`❌ ValidateExamData failed:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testExportExamData() {
    try {
        console.log('\n🧪 Testing ExportExamData...');
        const filters = { courseCode: 'CS101' };
        const result = await contract.evaluate('ExportExamData', 'summary', JSON.stringify(filters));
        const exportData = JSON.parse(utf8Decoder.decode(result));
        console.log(`✅ ExportExamData: Exported ${exportData.count} exams in summary format`);
        return { success: true, data: exportData };
    } catch (error) {
        console.error(`❌ ExportExamData failed:`, error.message);
        return { success: false, error: error.message };
    }
}

// API Routes

app.get('/api/test/health', (req, res) => {
    res.json({
        success: true,
        message: 'Chaincode Test API is running',
        timestamp: new Date().toISOString(),
        chaincode: chaincodeName,
        channel: channelName
    });
});

app.get('/api/test/run-all-tests', async (req, res) => {
    try {
        console.log('🚀 Starting comprehensive chaincode function tests...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // Run all tests
        results.tests.getAllExams = await testGetAllExams();
        results.tests.getExamById = await testGetExamById();
        results.tests.getExamsByCourse = await testGetExamsByCourse();
        results.tests.searchExams = await testSearchExams();
        results.tests.getExamStatistics = await testGetExamStatistics();
        results.tests.getExamFieldHistory = await testGetExamFieldHistory();
        results.tests.getCustomFieldsSchema = await testGetCustomFieldsSchema();
        results.tests.validateExamData = await testValidateExamData();
        results.tests.exportExamData = await testExportExamData();

        // Calculate summary
        const totalTests = Object.keys(results.tests).length;
        const passedTests = Object.values(results.tests).filter(test => test.success).length;
        const failedTests = totalTests - passedTests;

        results.summary = {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: Math.round((passedTests / totalTests) * 100)
        };

        console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed (${results.summary.successRate}%)`);
        
        res.json({
            success: true,
            message: 'All tests completed',
            results: results
        });

    } catch (error) {
        console.error('❌ Test execution failed:', error);
        res.status(500).json({
            success: false,
            message: 'Test execution failed',
            error: error.message
        });
    }
});

app.get('/api/test/individual/:testName', async (req, res) => {
    try {
        const { testName } = req.params;
        let result;

        switch (testName) {
            case 'getAllExams':
                result = await testGetAllExams();
                break;
            case 'getExamById':
                result = await testGetExamById();
                break;
            case 'getExamsByCourse':
                result = await testGetExamsByCourse();
                break;
            case 'searchExams':
                result = await testSearchExams();
                break;
            case 'getExamStatistics':
                result = await testGetExamStatistics();
                break;
            case 'getExamFieldHistory':
                result = await testGetExamFieldHistory();
                break;
            case 'getCustomFieldsSchema':
                result = await testGetCustomFieldsSchema();
                break;
            case 'validateExamData':
                result = await testValidateExamData();
                break;
            case 'exportExamData':
                result = await testExportExamData();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid test name',
                    availableTests: [
                        'getAllExams',
                        'getExamById',
                        'getExamsByCourse',
                        'searchExams',
                        'getExamStatistics',
                        'getExamFieldHistory',
                        'getCustomFieldsSchema',
                        'validateExamData',
                        'exportExamData'
                    ]
                });
        }

        res.json({
            success: true,
            testName: testName,
            result: result
        });

    } catch (error) {
        console.error('❌ Individual test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Individual test failed',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        availableEndpoints: [
            'GET /api/test/health',
            'GET /api/test/run-all-tests',
            'GET /api/test/individual/:testName'
        ]
    });
});

// Start server function
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Chaincode Test API server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/test/health`);
            console.log(`🧪 Run all tests: http://localhost:${PORT}/api/test/run-all-tests`);
            console.log(`📋 Individual tests: http://localhost:${PORT}/api/test/individual/:testName`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Chaincode Test API server...');
    if (gateway) {
        gateway.close();
    }
    process.exit(0);
});

// Start the server
startServer(); 