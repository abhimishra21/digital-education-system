const express = require('express');
const cors = require('cors');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Configuration
const channelName = 'nagarnigamchannel';
const chaincodeName = 'nagarnigamrecord';
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
    } catch (error) {
        console.error('❌ Blockchain connection failed:', error);
        throw error;
    }
}

// API Routes

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        // Try to get metadata or any available function
        const result = await contract.evaluateTransaction('GetAllAssets');
        res.json({ 
            success: true, 
            message: 'University API is running',
            blockchain: 'Connected',
            channel: channelName,
            chaincode: chaincodeName,
            data: utf8Decoder.decode(result)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'University API is running but blockchain connection failed',
            error: error.message 
        });
    }
});

// Student Management (using asset functions)
app.post('/api/students', async (req, res) => {
    try {
        const { studentId, name, email, department, enrollmentYear } = req.body;
        
        const studentData = {
            ID: studentId,
            Color: department,
            Size: enrollmentYear.toString(),
            Owner: name,
            AppraisedValue: 1000
        };

        const result = await contract.submitTransaction('CreateAsset', 
            studentData.ID, 
            studentData.Color, 
            studentData.Size, 
            studentData.Owner, 
            studentData.AppraisedValue.toString()
        );
        res.json({ success: true, message: 'Student created successfully', data: utf8Decoder.decode(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/students/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await contract.evaluateTransaction('ReadAsset', studentId);
        const student = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Student not found' });
    }
});

app.put('/api/students/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { name, email, department, enrollmentYear } = req.body;
        
        const result = await contract.submitTransaction('UpdateAsset', 
            studentId, 
            department || 'Computer Science', 
            (enrollmentYear || 2023).toString(), 
            name || 'Unknown', 
            '1000'
        );
        res.json({ success: true, message: 'Student updated successfully', data: utf8Decoder.decode(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get All Students
app.get('/api/students', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllAssets');
        const students = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Faculty Management (using asset functions)
app.post('/api/faculty', async (req, res) => {
    try {
        const { facultyId, name, email, department, designation } = req.body;
        
        const facultyData = {
            ID: `FAC_${facultyId}`,
            Color: department,
            Size: '1',
            Owner: name,
            AppraisedValue: 2000
        };

        const result = await contract.submitTransaction('CreateAsset', 
            facultyData.ID, 
            facultyData.Color, 
            facultyData.Size, 
            facultyData.Owner, 
            facultyData.AppraisedValue.toString()
        );
        res.json({ success: true, message: 'Faculty created successfully', data: utf8Decoder.decode(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/faculty/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;
        const result = await contract.evaluateTransaction('ReadAsset', `FAC_${facultyId}`);
        const faculty = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: faculty });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Faculty not found' });
    }
});

// Course Management (using asset functions)
app.post('/api/courses', async (req, res) => {
    try {
        const { courseId, name, department, credits, instructor } = req.body;
        
        const courseData = {
            ID: `COURSE_${courseId}`,
            Color: department,
            Size: credits.toString(),
            Owner: instructor,
            AppraisedValue: 1500
        };

        const result = await contract.submitTransaction('CreateAsset', 
            courseData.ID, 
            courseData.Color, 
            courseData.Size, 
            courseData.Owner, 
            courseData.AppraisedValue.toString()
        );
        res.json({ success: true, message: 'Course created successfully', data: utf8Decoder.decode(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/courses/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const result = await contract.evaluateTransaction('ReadAsset', `COURSE_${courseId}`);
        const course = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: course });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Course not found' });
    }
});

// Transfer Asset (for enrollment simulation)
app.post('/api/enrollments', async (req, res) => {
    try {
        const { enrollmentId, studentId, courseId, semester, year } = req.body;
        
        const result = await contract.submitTransaction('TransferAsset', studentId, `ENROLLED_${courseId}`);
        res.json({ success: true, message: 'Enrollment created successfully', data: utf8Decoder.decode(result) });
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