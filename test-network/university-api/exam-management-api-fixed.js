const express = require('express');
const cors = require('cors');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Configuration
const channelName = 'university';
const chaincodeName = 'exam-management';
const chaincodeVersion = '1.0';
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

// API Routes

// 1. Health Check
app.get('/api/exam/health', (req, res) => {
    res.json({
        success: true,
        message: 'Exam Management API is running',
        timestamp: new Date().toISOString(),
        version: chaincodeVersion,
        network: channelName,
        chaincode: chaincodeName,
        status: 'operational'
    });
});

// 2. Create Exam (with endorsement policy handling)
app.post('/api/exam/create', async (req, res) => {
    try {
        const examData = req.body;
        
        // Validate required fields
        if (!examData.examId || !examData.examName || !examData.courseCode) {
            return res.status(400).json({
                success: false,
                message: 'Exam ID, exam name, and course code are required'
            });
        }

        // Add metadata for flexible field tracking
        const examRecord = {
            ...examData,
            metadata: {
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                version: '1.0',
                fieldHistory: [],
                customFields: {}
            },
            examId: examData.examId,
            examName: examData.examName,
            courseCode: examData.courseCode,
            ...Object.keys(examData).reduce((acc, key) => {
                if (!['examId', 'examName', 'courseCode', 'metadata'].includes(key)) {
                    acc[key] = examData[key];
                }
                return acc;
            }, {})
        };

        console.log('Submitting CreateExam transaction...');
        
        // Try to submit the transaction with proper error handling
        let result;
        try {
            result = await contract.submit('CreateExam', JSON.stringify(examRecord));
        } catch (submitError) {
            console.error('Submit error:', submitError);
            
            // Handle endorsement policy errors
            if (submitError.message.includes('ABORTED') || submitError.message.includes('endorse')) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction endorsement failed',
                    error: 'This transaction requires endorsement from multiple organizations. The current network configuration requires both Org1 and Org2 to endorse write transactions.',
                    solution: 'To fix this, either: 1) Configure the endorsement policy to allow single organization endorsement, or 2) Ensure both organizations are available and properly configured.',
                    details: submitError.message
                });
            }
            throw submitError;
        }
        
        const resultString = utf8Decoder.decode(result);
        
        let response;
        if (resultString && resultString.trim()) {
            try {
                response = JSON.parse(resultString);
            } catch (parseError) {
                response = { message: resultString };
            }
        } else {
            response = { message: 'Exam created successfully' };
        }
        
        res.json({
            success: true,
            message: 'Exam created successfully',
            data: response
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

// 3. Get Exam by ID (Fixed parameter passing)
app.get('/api/exam/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        console.log(`Getting exam with ID: ${examId}`);
        
        // Ensure parameter is passed as string
        const result = await contract.evaluate('GetExamById', examId.toString());
        const resultString = utf8Decoder.decode(result);
        
        console.log(`Raw result: ${resultString}`);
        
        let exam;
        if (resultString && resultString.trim() && resultString !== 'null') {
            try {
                exam = JSON.parse(resultString);
            } catch (parseError) {
                console.error('Error parsing exam data:', parseError);
                exam = null;
            }
        } else {
            exam = null;
        }
        
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

// 4. Get All Exams (Read operation - should work)
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

// 5. Get Exams by Course (Read operation - should work)
app.get('/api/exam/course/:courseCode', async (req, res) => {
    try {
        const { courseCode } = req.params;
        const result = await contract.evaluate('GetExamsByCourse', courseCode.toString());
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
        console.error('Error getting exams by course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exams by course',
            error: error.message
        });
    }
});

// 6. Update Exam (Write operation - may have endorsement issues)
app.put('/api/exam/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        const updateData = req.body;
        
        const fieldChanges = {
            timestamp: new Date().toISOString(),
            changedBy: 'admin',
            changes: Object.keys(updateData)
        };
        
        const result = await contract.submit('UpdateExam', examId.toString(), JSON.stringify(updateData), JSON.stringify(fieldChanges));
        const resultString = utf8Decoder.decode(result);
        
        let response;
        if (resultString && resultString.trim()) {
            try {
                response = JSON.parse(resultString);
            } catch (parseError) {
                response = { message: resultString };
            }
        } else {
            response = { message: 'Exam updated successfully' };
        }
        
        res.json({
            success: true,
            message: 'Exam updated successfully',
            data: response
        });
    } catch (error) {
        console.error('Error updating exam:', error);
        
        if (error.message.includes('ABORTED') || error.message.includes('endorse')) {
            res.status(400).json({
                success: false,
                message: 'Transaction endorsement failed',
                error: 'This transaction requires endorsement from multiple organizations.',
                details: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update exam',
                error: error.message
            });
        }
    }
});

// 7. Initialize Ledger (Write operation - may have endorsement issues)
app.post('/api/exam/init-ledger', async (req, res) => {
    try {
        console.log('🔄 Initializing exam management ledger with sample data...');
        
        const result = await contract.submit('InitLedger');
        const resultString = utf8Decoder.decode(result);
        
        let response;
        if (resultString && resultString.trim()) {
            try {
                response = JSON.parse(resultString);
            } catch (parseError) {
                response = { message: resultString };
            }
        } else {
            response = { message: 'Initialization completed' };
        }
        
        res.json({
            success: true,
            message: 'Exam Management Ledger initialized successfully',
            data: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error initializing ledger:', error);
        
        if (error.message.includes('ABORTED') || error.message.includes('endorse')) {
            res.status(400).json({
                success: false,
                message: 'Transaction endorsement failed',
                error: 'This transaction requires endorsement from multiple organizations.',
                details: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to initialize ledger',
                error: error.message
            });
        }
    }
});

// 8. Get Exam Statistics (Read operation - should work)
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

// 9. Search Exams (Read operation - should work)
app.post('/api/exam/search', async (req, res) => {
    try {
        const searchCriteria = req.body;
        const result = await contract.evaluate('SearchExams', JSON.stringify(searchCriteria));
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
            count: exams.length,
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
            'POST /api/exam/init-ledger',
            'POST /api/exam/create',
            'GET /api/exam/:examId',
            'PUT /api/exam/:examId',
            'GET /api/exam',
            'GET /api/exam/course/:courseCode',
            'POST /api/exam/search',
            'GET /api/exam/stats/overview'
        ]
    });
});

// Start server function
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Exam Management API server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/exam/health`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api/exam`);
            console.log(`⚠️  Note: Write operations may fail due to endorsement policy requirements`);
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