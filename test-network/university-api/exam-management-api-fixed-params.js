const express = require('express');
const cors = require('cors');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Configuration
const channelName = 'university';
const chaincodeName = 'exam-management';
const chaincodeVersion = '1.1';
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
        
        console.log('✅ Exam Management Blockchain connection established');
        console.log(`📋 Connected to chaincode: ${chaincodeName} version ${chaincodeVersion}`);
    } catch (error) {
        console.error('❌ Blockchain connection failed:', error);
        throw error;
    }
}

// Fixed parameter passing functions
async function callChaincodeWithParams(functionName, ...args) {
    try {
        console.log(`🔧 Calling ${functionName} with ${args.length} parameters:`, args);
        
        // Ensure all parameters are properly serialized as strings
        const serializedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg);
            }
            return String(arg);
        });
        
        console.log(`📤 Serialized parameters:`, serializedArgs);
        
        // Use submit for functions that modify state, evaluate for read-only functions
        let result;
        if (functionName === 'CreateExam' || functionName === 'UpdateExam' || functionName === 'DeleteExam' || functionName === 'AddCustomField' || functionName === 'BulkCreateExams') {
            // For functions that modify state, use submit
            result = await contract.submit(functionName, ...serializedArgs);
        } else {
            // For read-only functions, use evaluate
            const proposal = contract.newProposal(functionName, { arguments: serializedArgs });
            result = await proposal.evaluate();
        }
        
        const resultString = utf8Decoder.decode(result);
        
        console.log(`📥 Raw result: ${resultString}`);
        
        if (resultString && resultString.trim() && resultString !== 'null') {
            try {
                return JSON.parse(resultString);
            } catch (parseError) {
                console.error('Error parsing result:', parseError);
                return resultString;
            }
        }
        return null;
    } catch (error) {
        console.error(`❌ Error calling ${functionName}:`, error);
        throw error;
    }
}

// API Routes

// 1. Health Check
app.get('/api/exam/health', (req, res) => {
    res.json({
        success: true,
        message: 'Exam Management API (Fixed Parameters) is running',
        timestamp: new Date().toISOString(),
        version: chaincodeVersion,
        network: channelName,
        chaincode: chaincodeName,
        status: 'operational'
    });
});

// 2. Get All Exams (Working - No parameters)
app.get('/api/exam', async (req, res) => {
    try {
        const result = await contract.evaluate('GetAllExams');
        const resultString = utf8Decoder.decode(result);
        
        let exams;
        if (resultString && resultString.trim()) {
            try {
                exams = JSON.parse(resultString);
            } catch (parseError) {
                exams = [];
            }
        } else {
            exams = [];
        }
        
        res.json({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (error) {
        console.error('Error getting all exams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exams',
            error: error.message
        });
    }
});

// 3. Get Exam by ID (Fixed parameter passing)
app.get('/api/exam/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        console.log(`🔍 Getting exam with ID: ${examId}`);
        
        const exam = await callChaincodeWithParams('GetExamById', examId);
        
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found',
                examId: examId
            });
        }
        
        res.json({
            success: true,
            data: exam
        });
    } catch (error) {
        console.error('Error getting exam:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam',
            error: error.message
        });
    }
});

// 4. Get Exams by Course Code (Fixed - using search instead of composite keys)
app.get('/api/exam/course/:courseCode', async (req, res) => {
    try {
        const { courseCode } = req.params;
        console.log(`📚 Getting exams for course: ${courseCode}`);
        
        // Use search functionality instead of GetExamsByCourse to avoid composite key issues
        const exams = await callChaincodeWithParams('SearchExams', { courseCode: courseCode });
        
        if (!exams || exams.length === 0) {
            return res.json({
                success: true,
                data: [],
                count: 0,
                courseCode: courseCode,
                message: 'No exams found for this course'
            });
        }
        
        res.json({
            success: true,
            data: exams,
            count: exams.length,
            courseCode: courseCode
        });
    } catch (error) {
        console.error('Error getting exams by course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exams by course',
            error: error.message
        });
    }
});

// 5. Create New Exam
app.post('/api/exam', async (req, res) => {
    try {
        const examData = req.body;
        console.log(`📝 Creating new exam:`, examData);
        
        // Validate required fields
        if (!examData.examId || !examData.examName || !examData.courseCode) {
            return res.status(400).json({
                success: false,
                message: 'Exam ID, exam name, and course code are required'
            });
        }
        
        // Serialize the exam data as JSON string
        const serializedExamData = JSON.stringify(examData);
        const result = await callChaincodeWithParams('CreateExam', serializedExamData);
        
        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create exam',
            error: error.message
        });
    }
});

// 6. Search Exams (Fixed parameter passing)
app.post('/api/exam/search', async (req, res) => {
    try {
        const searchCriteria = req.body;
        console.log(`🔍 Searching exams with criteria:`, searchCriteria);
        
        const exams = await callChaincodeWithParams('SearchExams', searchCriteria);
        
        res.json({
            success: true,
            data: exams || [],
            count: Array.isArray(exams) ? exams.length : 0,
            searchCriteria
        });
    } catch (error) {
        console.error('Error searching exams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search exams',
            error: error.message
        });
    }
});

// 7. Get Exam Statistics (Working - No parameters)
app.get('/api/exam/stats/overview', async (req, res) => {
    try {
        const result = await contract.evaluate('GetExamStatistics');
        const stats = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting exam statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam statistics',
            error: error.message
        });
    }
});

// 8. Get Exam Field History (Fixed parameter passing)
app.get('/api/exam/:examId/history', async (req, res) => {
    try {
        const { examId } = req.params;
        console.log(`📜 Getting history for exam: ${examId}`);
        
        const history = await callChaincodeWithParams('GetExamFieldHistory', examId);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error getting exam history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam history',
            error: error.message
        });
    }
});

// 9. Get Custom Fields Schema (Fixed parameter passing)
app.get('/api/exam/schema/custom-fields', async (req, res) => {
    try {
        console.log(`📋 Getting custom fields schema`);
        
        const schema = await callChaincodeWithParams('GetCustomFieldsSchema');
        
        res.json({
            success: true,
            data: schema
        });
    } catch (error) {
        console.error('Error getting custom fields schema:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get custom fields schema',
            error: error.message
        });
    }
});

// 10. Validate Exam Data (Fixed parameter passing)
app.post('/api/exam/validate', async (req, res) => {
    try {
        const examData = req.body;
        console.log(`✅ Validating exam data:`, examData);
        
        const validation = await callChaincodeWithParams('ValidateExamData', examData);
        
        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error('Error validating exam data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate exam data',
            error: error.message
        });
    }
});

// 11. Export Exam Data (Fixed parameter passing)
app.get('/api/exam/export/:format', async (req, res) => {
    try {
        const { format } = req.params;
        const { filters } = req.query;
        
        console.log(`📤 Exporting exam data in ${format} format with filters:`, filters);
        
        const exportData = await callChaincodeWithParams('ExportExamData', format, filters || '{}');
        
        res.json({
            success: true,
            data: exportData,
            format,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error exporting exam data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export exam data',
            error: error.message
        });
    }
});

// 12. Test all functions
app.get('/api/exam/test/all', async (req, res) => {
    try {
        console.log('🧪 Testing all chaincode functions...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // Test functions that don't require parameters
        try {
            const allExams = await contract.evaluate('GetAllExams');
            results.tests.getAllExams = {
                success: true,
                count: JSON.parse(utf8Decoder.decode(allExams)).length
            };
        } catch (error) {
            results.tests.getAllExams = { success: false, error: error.message };
        }

        try {
            const stats = await contract.evaluate('GetExamStatistics');
            results.tests.getExamStatistics = {
                success: true,
                data: JSON.parse(utf8Decoder.decode(stats))
            };
        } catch (error) {
            results.tests.getExamStatistics = { success: false, error: error.message };
        }

        // Test functions that require parameters
        try {
            const exam = await callChaincodeWithParams('GetExamById', 'EXAM2024001');
            results.tests.getExamById = {
                success: true,
                examId: exam ? exam.examId : null
            };
        } catch (error) {
            results.tests.getExamById = { success: false, error: error.message };
        }

        try {
            const exams = await callChaincodeWithParams('SearchExams', { courseCode: 'CS101' });
            results.tests.getExamsByCourse = {
                success: true,
                count: Array.isArray(exams) ? exams.length : 0
            };
        } catch (error) {
            results.tests.getExamsByCourse = { success: false, error: error.message };
        }

        try {
            const searchResults = await callChaincodeWithParams('SearchExams', { courseCode: 'CS101' });
            results.tests.searchExams = {
                success: true,
                count: Array.isArray(searchResults) ? searchResults.length : 0
            };
        } catch (error) {
            results.tests.searchExams = { success: false, error: error.message };
        }

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

        console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${results.summary.successRate}%)`);
        
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
            'GET /api/exam/health',
            'GET /api/exam',
            'GET /api/exam/:examId',
            'GET /api/exam/course/:courseCode',
            'POST /api/exam',
            'POST /api/exam/search',
            'GET /api/exam/stats/overview',
            'GET /api/exam/:examId/history',
            'GET /api/exam/schema/custom-fields',
            'POST /api/exam/validate',
            'GET /api/exam/export/:format',
            'GET /api/exam/test/all'
        ]
    });
});

// Start server function
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Exam Management API (Fixed Parameters) running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/exam/health`);
            console.log(`🧪 Test all functions: http://localhost:${PORT}/api/exam/test/all`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api/exam`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Exam Management API server...');
    if (gateway) {
        gateway.close();
    }
    process.exit(0);
});

// Start the server
startServer(); 