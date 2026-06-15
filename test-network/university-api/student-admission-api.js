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

// Blockchain Configuration for Student Admission
const channelName = 'university';
const chaincodeName = 'studentadmission';
const chaincodeVersion = '1.5';
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
        
        console.log('✅ Student Admission Blockchain connection established');
        console.log(`📋 Connected to chaincode: ${chaincodeName} version ${chaincodeVersion}`);
    } catch (error) {
        console.error('❌ Student Admission Blockchain connection failed:', error);
        throw error;
    }
}

// API Routes for Student Admission

// 1. Search Student by Enrollment Number (Main functionality)
app.get('/api/students/enrollment/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        
        if (!enrollmentNo) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number is required'
            });
        }

        console.log(`🔍 Searching for student with enrollment number: ${enrollmentNo}`);
        
        const result = await contract.evaluateTransaction('GetStudentByEnrollment', enrollmentNo);
        const studentData = utf8Decoder.decode(result);
        
        if (!studentData || studentData === 'null') {
            return res.status(404).json({
                success: false,
                message: `Student with enrollment number ${enrollmentNo} not found`
            });
        }

        const student = JSON.parse(studentData);
        console.log(`✅ Student found: ${student.firstName} ${student.lastName}`);
        
        res.json({
            success: true,
            message: 'Student details retrieved successfully',
            data: student
        });
    } catch (error) {
        console.error('❌ Error searching student by enrollment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search student',
            error: error.message
        });
    }
});

// 2. Register New Student
app.post('/api/students/register', async (req, res) => {
    try {
        const studentData = req.body;
        
        if (!studentData.enrollmentNo || !studentData.firstName || !studentData.lastName) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number, first name, and last name are required'
            });
        }

        console.log(`📝 Registering new student: ${studentData.enrollmentNo}`);
        
        const result = await contract.submitTransaction('RegisterStudent', JSON.stringify(studentData));
        const response = utf8Decoder.decode(result);
        
        console.log(`✅ Student registered successfully: ${studentData.enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student registered successfully',
            data: JSON.parse(response)
        });
    } catch (error) {
        console.error('❌ Error registering student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register student',
            error: error.message
        });
    }
});

// 3. Update Student Information
app.put('/api/students/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const updateData = req.body;
        
        if (!enrollmentNo) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number is required'
            });
        }

        console.log(`📝 Updating student: ${enrollmentNo}`);
        
        // First get the current student data
        const currentResult = await contract.evaluateTransaction('GetStudentByEnrollment', enrollmentNo);
        const currentStudent = JSON.parse(utf8Decoder.decode(currentResult));
        
        // Merge the current data with update data
        const updatedStudent = {
            ...currentStudent,
            ...updateData,
            enrollmentNo: enrollmentNo, // Ensure enrollment number doesn't change
            updatedAt: new Date().toISOString()
        };
        
        // Try to register the updated student (this will overwrite if allowed)
        const result = await contract.submitTransaction('RegisterStudent', JSON.stringify(updatedStudent));
        const response = utf8Decoder.decode(result);
        
        console.log(`✅ Student updated successfully: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student updated successfully',
            data: JSON.parse(response)
        });
    } catch (error) {
        console.error('❌ Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student',
            error: error.message
        });
    }
});

// 4. Get All Students
app.get('/api/students', async (req, res) => {
    try {
        console.log('📋 Getting all students...');
        
        const result = await contract.evaluateTransaction('GetAllStudents');
        const studentsData = utf8Decoder.decode(result);
        
        console.log(`✅ Retrieved all students successfully`);
        
        res.json({
            success: true,
            message: 'All students retrieved successfully',
            data: JSON.parse(studentsData)
        });
    } catch (error) {
        console.error('❌ Error getting all students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get all students',
            error: error.message
        });
    }
});

// 5. Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Student Admission API is running',
        timestamp: new Date().toISOString(),
        blockchainInfo: {
            channel: channelName,
            chaincode: chaincodeName,
            version: chaincodeVersion
        }
    });
});

// Start server
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Student Admission API server running on port ${PORT}`);
            console.log(`📋 API Documentation:`);
            console.log(`   GET  /api/health - Health check`);
            console.log(`   GET  /api/students/enrollment/:enrollmentNo - Search student by enrollment number`);
            console.log(`   POST /api/students/register - Register new student`);
            console.log(`   PUT  /api/students/:enrollmentNo - Update student information`);
            console.log(`   GET  /api/students - Get all students`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 