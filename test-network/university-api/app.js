const express = require('express');
const cors = require('cors');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Configuration
const channelName = 'university';
const chaincodeName = 'comprehensive-student-admission';
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
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
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
        
        console.log('✅ Blockchain connection established');
        console.log(`📋 Channel: ${channelName}`);
        console.log(`📦 Chaincode: ${chaincodeName}`);
    } catch (error) {
        console.error('❌ Blockchain connection failed:', error);
        throw error;
    }
}

// API Routes

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'University Blockchain API is running',
        timestamp: new Date().toISOString(),
        blockchainInfo: {
            channel: channelName,
            chaincode: chaincodeName
        }
    });
});

// 2. Initialize Ledger
app.post('/api/admin/init-ledger', async (req, res) => {
    try {
        console.log('🔧 Initializing ledger with sample data...');
        const result = await contract.submitTransaction('InitLedger');
        res.json({ success: true, message: 'Ledger initialized successfully', data: utf8Decoder.decode(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Student Management (Using Comprehensive Student Admission Chaincode)
app.post('/api/students', async (req, res) => {
    try {
        const studentData = req.body;
        
        // Validate required fields
        if (!studentData.enrollmentNo || !studentData.firstName || !studentData.lastName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Enrollment number, first name, and last name are required' 
            });
        }
        
        const result = await contract.submitTransaction('RegisterStudent', JSON.stringify(studentData));
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'Student registered successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllStudents');
        const students = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/students/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.evaluateTransaction('GetStudentByEnrollment', enrollmentNo);
        const student = JSON.parse(utf8Decoder.decode(result));
        if (!student || student.length === 0) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Student not found' });
    }
});

// Update student with proper error handling
app.put('/api/students/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const updateData = req.body;
        
        // Ensure enrollment number is preserved
        updateData.enrollmentNo = enrollmentNo;
        
        const result = await contract.submitTransaction('UpdateStudent', enrollmentNo, JSON.stringify(updateData));
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'Student updated successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete student with proper error handling
app.delete('/api/students/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.submitTransaction('DeleteStudent', enrollmentNo);
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'Student deleted successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get student history
app.get('/api/students/:enrollmentNo/history', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.evaluateTransaction('GetStudentHistory', enrollmentNo);
        const history = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Additional student management endpoints
app.get('/api/students/course/:course', async (req, res) => {
    try {
        const { course } = req.params;
        const result = await contract.evaluateTransaction('GetStudentsByCourse', course);
        const students = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/students/search/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        const result = await contract.evaluateTransaction('SearchStudentsByName', searchTerm);
        const students = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/students/:enrollmentNo/gpa', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const { gpa } = req.body;
        const result = await contract.submitTransaction('UpdateStudentGPA', enrollmentNo, gpa.toString());
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'GPA updated successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/students/:enrollmentNo/transfer', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const { newCourse } = req.body;
        const result = await contract.submitTransaction('TransferStudentCourse', enrollmentNo, newCourse);
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'Student transferred successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/students/statistics', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetStudentStatistics');
        const statistics = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: statistics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 University API Server running on port ${PORT}`);
            console.log(`📚 Channel: ${channelName}`);
            console.log(`📦 Chaincode: ${chaincodeName}`);
            console.log(`🔗 Blockchain: Connected`);
            console.log(`📖 API Documentation: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    if (gateway) {
        gateway.close();
    }
    process.exit(0);
});

startServer(); 