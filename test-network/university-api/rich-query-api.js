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

// Rich Query API Routes

// Health check
app.get('/api/rich-query/health', (req, res) => {
    res.json({
        success: true,
        message: 'Rich Query API is running',
        timestamp: new Date().toISOString(),
        features: [
            'Course-based queries',
            'GPA range queries',
            'Name pattern matching',
            'Date range queries',
            'Complex multi-criteria queries',
            'Pagination support',
            'Email domain queries',
            'Address pattern queries',
            'Phone number queries',
            'Parent name queries',
            'Custom selector queries'
        ]
    });
});

// 1. Query students by course
app.get('/api/rich-query/students/course/:course', async (req, res) => {
    try {
        const { course } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByCourse', course);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students in course: ${course}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by course'
        });
    }
});

// 2. Query students by GPA range
app.get('/api/rich-query/students/gpa/:minGPA/:maxGPA', async (req, res) => {
    try {
        const { minGPA, maxGPA } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByGPARange', minGPA, maxGPA);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with GPA between ${minGPA} and ${maxGPA}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by GPA range'
        });
    }
});

// 3. Query students by status and semester
app.get('/api/rich-query/students/status/:status/semester/:semester', async (req, res) => {
    try {
        const { status, semester } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByStatusAndSemester', status, semester);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with status ${status} in semester ${semester}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by status and semester'
        });
    }
});

// 4. Query students by name pattern
app.get('/api/rich-query/students/name/:pattern', async (req, res) => {
    try {
        const { pattern } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByNamePattern', pattern);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with name containing: ${pattern}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by name pattern'
        });
    }
});

// 5. Query students by admission date range
app.get('/api/rich-query/students/admission/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByAdmissionDateRange', startDate, endDate);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students admitted between ${startDate} and ${endDate}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by admission date range'
        });
    }
});

// 6. Query high performing students
app.post('/api/rich-query/students/high-performing', async (req, res) => {
    try {
        const { minGPA, courses } = req.body;
        const result = await contract.evaluateTransaction('QueryHighPerformingStudents', minGPA.toString(), JSON.stringify(courses));
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `High performing students (GPA >= ${minGPA}) in courses: ${courses.join(', ')}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query high performing students'
        });
    }
});

// 7. Query students by multiple criteria
app.post('/api/rich-query/students/criteria', async (req, res) => {
    try {
        const { criteria } = req.body;
        const result = await contract.evaluateTransaction('QueryStudentsByMultipleCriteria', JSON.stringify(criteria));
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students matching criteria: ${JSON.stringify(criteria)}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by multiple criteria'
        });
    }
});

// 8. Query students with pagination
app.get('/api/rich-query/students/paginated', async (req, res) => {
    try {
        const { pageSize = 10, bookmark = 'null' } = req.query;
        const result = await contract.evaluateTransaction('QueryStudentsWithPagination', pageSize.toString(), bookmark);
        const response = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: response.results,
            pagination: {
                bookmark: response.bookmark,
                hasMore: response.hasMore,
                pageSize: parseInt(pageSize)
            },
            count: response.results.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students with pagination'
        });
    }
});

// 9. Query students by email domain
app.get('/api/rich-query/students/email-domain/:domain', async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByEmailDomain', domain);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with email domain: ${domain}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by email domain'
        });
    }
});

// 10. Query students by address pattern
app.get('/api/rich-query/students/address/:pattern', async (req, res) => {
    try {
        const { pattern } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByAddressPattern', pattern);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with address containing: ${pattern}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by address pattern'
        });
    }
});

// 11. Query students by phone pattern
app.get('/api/rich-query/students/phone/:pattern', async (req, res) => {
    try {
        const { pattern } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByPhonePattern', pattern);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with phone number containing: ${pattern}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by phone pattern'
        });
    }
});

// 12. Query students by parent name
app.get('/api/rich-query/students/parent/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByParentName', name);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with parent name containing: ${name}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by parent name'
        });
    }
});

// 13. Query students by date of birth range
app.get('/api/rich-query/students/birth-date/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByDateOfBirthRange', startDate, endDate);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students born between ${startDate} and ${endDate}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by date of birth range'
        });
    }
});

// 14. Query students by enrollment pattern
app.get('/api/rich-query/students/enrollment/:pattern', async (req, res) => {
    try {
        const { pattern } = req.params;
        const result = await contract.evaluateTransaction('QueryStudentsByEnrollmentPattern', pattern);
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with enrollment number containing: ${pattern}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by enrollment pattern'
        });
    }
});

// 15. Query students by custom selector
app.post('/api/rich-query/students/custom', async (req, res) => {
    try {
        const { selector } = req.body;
        const result = await contract.evaluateTransaction('QueryStudentsByCustomSelector', JSON.stringify(selector));
        const students = JSON.parse(utf8Decoder.decode(result));
        
        res.json({
            success: true,
            data: students,
            query: `Students with custom selector: ${JSON.stringify(selector)}`,
            count: students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to query students by custom selector'
        });
    }
});

// Demo endpoint showing all available queries
app.get('/api/rich-query/demo', (req, res) => {
    const demos = [
        {
            name: 'Query by Course',
            method: 'GET',
            url: '/api/rich-query/students/course/Computer Science',
            description: 'Find all students in Computer Science course'
        },
        {
            name: 'Query by GPA Range',
            method: 'GET',
            url: '/api/rich-query/students/gpa/3.0/4.0',
            description: 'Find students with GPA between 3.0 and 4.0'
        },
        {
            name: 'Query by Status and Semester',
            method: 'GET',
            url: '/api/rich-query/students/status/Active/semester/1',
            description: 'Find active students in first semester'
        },
        {
            name: 'Query by Name Pattern',
            method: 'GET',
            url: '/api/rich-query/students/name/Kumar',
            description: 'Find students with name containing "Kumar"'
        },
        {
            name: 'Query by Admission Date Range',
            method: 'GET',
            url: '/api/rich-query/students/admission/2024-01-01/2024-12-31',
            description: 'Find students admitted in 2024'
        },
        {
            name: 'Query High Performing Students',
            method: 'POST',
            url: '/api/rich-query/students/high-performing',
            body: {
                minGPA: 3.5,
                courses: ['Computer Science', 'Electrical Engineering']
            },
            description: 'Find high performing students in specific courses'
        },
        {
            name: 'Query by Multiple Criteria',
            method: 'POST',
            url: '/api/rich-query/students/criteria',
            body: {
                criteria: {
                    status: 'Active',
                    semester: 1,
                    gpa: { $gte: 3.0 }
                }
            },
            description: 'Find students matching multiple criteria'
        },
        {
            name: 'Query with Pagination',
            method: 'GET',
            url: '/api/rich-query/students/paginated?pageSize=5',
            description: 'Get students with pagination support'
        },
        {
            name: 'Query by Email Domain',
            method: 'GET',
            url: '/api/rich-query/students/email-domain/email.com',
            description: 'Find students with specific email domain'
        },
        {
            name: 'Query by Address Pattern',
            method: 'GET',
            url: '/api/rich-query/students/address/Delhi',
            description: 'Find students with address containing "Delhi"'
        },
        {
            name: 'Query by Phone Pattern',
            method: 'GET',
            url: '/api/rich-query/students/phone/987',
            description: 'Find students with phone number containing "987"'
        },
        {
            name: 'Query by Parent Name',
            method: 'GET',
            url: '/api/rich-query/students/parent/Kumar',
            description: 'Find students with parent name containing "Kumar"'
        },
        {
            name: 'Query by Date of Birth Range',
            method: 'GET',
            url: '/api/rich-query/students/birth-date/1995-01-01/2000-12-31',
            description: 'Find students born between 1995 and 2000'
        },
        {
            name: 'Query by Enrollment Pattern',
            method: 'GET',
            url: '/api/rich-query/students/enrollment/EN2024',
            description: 'Find students with enrollment number containing "EN2024"'
        },
        {
            name: 'Custom Selector Query',
            method: 'POST',
            url: '/api/rich-query/students/custom',
            body: {
                selector: {
                    $and: [
                        { status: 'Active' },
                        { course: 'Computer Science' },
                        { gpa: { $gte: 3.5 } }
                    ]
                }
            },
            description: 'Use custom CouchDB selector for complex queries'
        }
    ];

    res.json({
        success: true,
        message: 'Rich Query API Demo Endpoints',
        demos: demos,
        note: 'These queries demonstrate the power of CouchDB rich querying capabilities'
    });
});

// Start server
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Rich Query API Server running on port ${PORT}`);
            console.log(`📊 CouchDB Web Interface: http://localhost:5984/_utils`);
            console.log(`🔍 Demo queries: http://localhost:${PORT}/api/rich-query/demo`);
            console.log(`📖 API Documentation: http://localhost:${PORT}/api/rich-query/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 