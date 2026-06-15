const express = require('express');
const cors = require('cors');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const app = express();
const PORT = 3002; // Different port to avoid conflicts
app.listen(3002, '0.0.0.0', () => {
  console.log('API running on http://0.0.0.0:3002');
});

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Configuration
const channelName = 'university';
const chaincodeName = 'academic-records'; // New chaincode name for academic records
const mspId = 'Org1MSP';

// Paths to crypto materials
const cryptoPath = path.resolve(__dirname, './test-network/organizations/peerOrganizations/org1.example.com');
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
    const client = new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
        'grpc.keepalive_time_ms': 120000,
        'grpc.keepalive_timeout_ms': 20000,
        'grpc.keepalive_permit_without_calls': 1,
    });
    return client;
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
            // *** Enable service discovery here ***
            discovery: { enabled: true, asLocalhost: true },
        });

        network = gateway.getNetwork(channelName);
        contract = network.getContract(chaincodeName);
        
        console.log('✅ Academic Records Blockchain connection established');
        console.log(`📋 Channel: ${channelName}`);
        console.log(`📦 Chaincode: ${chaincodeName}`);
    } catch (error) {
        console.error('❌ Academic Records Blockchain connection failed:', error);
        throw error;
    }
}

// API Routes

// 1. Health Check
app.get('/api/academic/health', (req, res) => {
    res.json({
        success: true,
        message: 'Academic Records Blockchain API is running',
        timestamp: new Date().toISOString(),
        blockchainInfo: {
            channel: channelName,
            chaincode: chaincodeName
        }
    });
});

// 2. Initialize Academic Records Ledger
app.post('/api/academic/admin/init-ledger', async (req, res) => {
    try {
        console.log('🔧 Initializing academic records ledger with sample data...');
        const result = await contract.submitTransaction('InitLedger');
        res.json({ success: true, message: 'Academic records ledger initialized successfully', data: utf8Decoder.decode(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Academic Records Management

// Create new academic record
// app.post('/api/academic/records', async (req, res) => {
//     try {
//         const recordData = req.body;
//         // Only require enrollmentNo
//         if (!recordData.enrollmentNo) {
//             return res.status(400).json({ 
//                 success: false, 
//                 error: 'enrollmentNo is required' 
//             });
//         }
//         const result = await contract.submitTransaction('CreateAcademicRecord', JSON.stringify(recordData));
//         const response = JSON.parse(utf8Decoder.decode(result));
//         res.json({ success: true, message: 'Academic record created successfully', data: response });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// Create new academic record
app.post('/api/academic/records', async (req, res) => {
    try {
        const recordData = req.body;

        // Only require enrollmentNo
        if (!recordData.enrollmentNo) {
            return res.status(400).json({ 
                success: false, 
                error: 'enrollmentNo is required' 
            });
        }

        const { enrollmentNo, cycle, examMonth, examYear, examType, resultHash } = recordData;

        // Remove the duplicate pre-check - let the chaincode handle it
        // The chaincode now properly checks for duplicates based on all fields

        // Proceed to create the new academic record (chaincode enforces uniqueness when all fields are present)
        const result = await contract.submitTransaction('CreateAcademicRecord', JSON.stringify(recordData));
        const response = JSON.parse(utf8Decoder.decode(result));

        // Return successful response
        res.json({ success: true, message: 'Academic record created successfully', data: response });

    } catch (error) {
        console.error('Error creating academic record:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Get all academic records
app.get('/api/academic/records', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllAcademicRecords');
        const records = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lookup by unique fields (place before parameterized routes to avoid shadowing)
app.get('/api/academic/records/unique', async (req, res) => {
    try {
        const { enrollmentNo, cycle, examMonth, examYear, examType, resultHash } = req.query;
        if (!enrollmentNo || !cycle || !examMonth || !examYear || !examType || !resultHash) {
            return res.status(400).json({
                success: false,
                error: 'enrollmentNo, cycle, examMonth, examYear, examType, resultHash are required'
            });
        }
        const result = await contract.evaluateTransaction(
            'GetAcademicRecordByUniqueFields',
            `${enrollmentNo}`,
            `${cycle}`,
            `${examMonth}`,
            `${examYear}`,
            `${examType}`,
            `${resultHash}`
        );
        const decoded = utf8Decoder.decode(result);
        if (!decoded || decoded === 'null' || decoded === '') {
            return res.status(404).json({ success: false, error: 'Academic record not found' });
        }
        const record = JSON.parse(decoded);
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic record by enrollmentNo
app.get('/api/academic/records/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.evaluateTransaction('GetAcademicRecordById', enrollmentNo);
        const record = JSON.parse(utf8Decoder.decode(result));
        if (!record || Object.keys(record).length === 0) {
            return res.status(404).json({ success: false, error: 'Academic record not found' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Academic record not found' });
    }
});

// Get academic records by enrollment number
app.get('/api/academic/records/enrollment/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.evaluateTransaction('GetAcademicRecordsByEnrollment', enrollmentNo);
        const records = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update academic record by enrollmentNo
app.put('/api/academic/records/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const updateData = req.body;
        const result = await contract.submitTransaction('UpdateAcademicRecord', enrollmentNo, JSON.stringify(updateData));
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'Academic record updated successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete academic record by enrollmentNo
app.delete('/api/academic/records/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.submitTransaction('DeleteAcademicRecord', enrollmentNo);
        const response = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, message: 'Academic record deleted successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic record history by enrollmentNo
app.get('/api/academic/records/:enrollmentNo/history', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const result = await contract.evaluateTransaction('GetAcademicRecordHistory', enrollmentNo);
        const history = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic records by education level
app.get('/api/academic/records/level/:educationLevel', async (req, res) => {
    try {
        const { educationLevel } = req.params;
        const result = await contract.evaluateTransaction('GetAcademicRecordsByEducationLevel', educationLevel);
        const records = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search academic records by institution
app.get('/api/academic/records/search/institution/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        const result = await contract.evaluateTransaction('SearchAcademicRecordsByInstitution', searchTerm);
        const records = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic statistics
app.get('/api/academic/statistics', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAcademicStatistics');
        const statistics = JSON.parse(utf8Decoder.decode(result));
        res.json({ success: true, data: statistics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Advanced Academic Records Features

// Bulk create academic records (only require enrollmentNo for each)
app.post('/api/academic/records/bulk', async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Records array is required and must not be empty' 
            });
        }
        const results = [];
        for (const record of records) {
            try {
                if (!record.enrollmentNo) {
                    throw new Error('enrollmentNo is required');
                }
                const result = await contract.submitTransaction('CreateAcademicRecord', JSON.stringify(record));
                const response = JSON.parse(utf8Decoder.decode(result));
                results.push({ success: true, enrollmentNo: record.enrollmentNo, data: response });
            } catch (error) {
                results.push({ success: false, enrollmentNo: record.enrollmentNo, error: error.message });
            }
        }
        res.json({ success: true, message: 'Bulk operation completed', data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic records by stream
app.get('/api/academic/records/stream/:stream', async (req, res) => {
    try {
        const { stream } = req.params;
        const result = await contract.evaluateTransaction('GetAllAcademicRecords');
        const allRecords = JSON.parse(utf8Decoder.decode(result));
        const filteredRecords = allRecords.filter(record => 
            record.stream && record.stream.toLowerCase() === stream.toLowerCase()
        );
        res.json({ success: true, data: filteredRecords });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic records by passing year range
app.get('/api/academic/records/year-range', async (req, res) => {
    try {
        const { startYear, endYear } = req.query;
        
        if (!startYear || !endYear) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start year and end year are required' 
            });
        }
        
        const result = await contract.evaluateTransaction('GetAllAcademicRecords');
        const allRecords = JSON.parse(utf8Decoder.decode(result));
        const filteredRecords = allRecords.filter(record => {
            const passingYear = parseInt(record.passingYear);
            return passingYear >= parseInt(startYear) && passingYear <= parseInt(endYear);
        });
        
        res.json({ success: true, data: filteredRecords });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Academic Records API Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Lookup by unique fields (for QR scan)
app.get('/api/academic/records/unique', async (req, res) => {
    try {
        const { enrollmentNo, cycle, examMonth, examYear, examType, resultHash } = req.query;
        if (!enrollmentNo || !cycle || !examMonth || !examYear || !examType || !resultHash) {
            return res.status(400).json({
                success: false,
                error: 'enrollmentNo, cycle, examMonth, examYear, examType, resultHash are required'
            });
        }
        const result = await contract.evaluateTransaction(
            'GetAcademicRecordByUniqueFields',
            `${enrollmentNo}`,
            `${cycle}`,
            `${examMonth}`,
            `${examYear}`,
            `${examType}`,
            `${resultHash}`
        );
        const decoded = utf8Decoder.decode(result);
        if (!decoded || decoded === 'null' || decoded === '') {
            return res.status(404).json({ success: false, error: 'Academic record not found' });
        }
        const record = JSON.parse(decoded);
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Academic Records API Server running on port ${PORT}`);
            console.log(`📚 Channel: ${channelName}`);
            console.log(`📦 Chaincode: ${chaincodeName}`);
            console.log(`🔗 Blockchain: Connected`);
            console.log(`🌐 API base URL: http://localhost:${PORT}/api/academic`);
        });
    } catch (error) {
        console.error('Failed to start Academic Records API server:', error);
        process.exit(1);
    }
}

startServer();
