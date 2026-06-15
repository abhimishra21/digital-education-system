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

// CouchDB Rich Query Functions

/**
 * Query students by course using CouchDB rich queries
 */
async function queryStudentsByCourse(course) {
    try {
        // CouchDB selector for course query
        const selector = {
            selector: {
                course: course
            }
        };

        const result = await contract.evaluateTransaction('QueryStudentsByCourse', JSON.stringify(selector));
        return JSON.parse(utf8Decoder.decode(result));
    } catch (error) {
        console.error('Error querying students by course:', error);
        throw error;
    }
}

/**
 * Query students by GPA range using CouchDB rich queries
 */
async function queryStudentsByGPARange(minGPA, maxGPA) {
    try {
        const selector = {
            selector: {
                gpa: {
                    $gte: minGPA,
                    $lte: maxGPA
                }
            }
        };

        const result = await contract.evaluateTransaction('QueryStudentsByGPARange', JSON.stringify(selector));
        return JSON.parse(utf8Decoder.decode(result));
    } catch (error) {
        console.error('Error querying students by GPA range:', error);
        throw error;
    }
}

/**
 * Query students by status and semester
 */
async function queryStudentsByStatusAndSemester(status, semester) {
    try {
        const selector = {
            selector: {
                status: status,
                semester: semester
            }
        };

        const result = await contract.evaluateTransaction('QueryStudentsByStatusAndSemester', JSON.stringify(selector));
        return JSON.parse(utf8Decoder.decode(result));
    } catch (error) {
        console.error('Error querying students by status and semester:', error);
        throw error;
    }
}

/**
 * Query students by name pattern (partial match)
 */
async function queryStudentsByNamePattern(namePattern) {
    try {
        const selector = {
            selector: {
                $or: [
                    {
                        firstName: {
                            $regex: namePattern
                        }
                    },
                    {
                        lastName: {
                            $regex: namePattern
                        }
                    }
                ]
            }
        };

        const result = await contract.evaluateTransaction('QueryStudentsByNamePattern', JSON.stringify(selector));
        return JSON.parse(utf8Decoder.decode(result));
    } catch (error) {
        console.error('Error querying students by name pattern:', error);
        throw error;
    }
}

/**
 * Query students by admission date range
 */
async function queryStudentsByAdmissionDateRange(startDate, endDate) {
    try {
        const selector = {
            selector: {
                admissionDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        };

        const result = await contract.evaluateTransaction('QueryStudentsByAdmissionDateRange', JSON.stringify(selector));
        return JSON.parse(utf8Decoder.decode(result));
    } catch (error) {
        console.error('Error querying students by admission date range:', error);
        throw error;
    }
}

/**
 * Complex query: Students with high GPA in specific courses
 */
async function queryHighPerformingStudents(minGPA, courses) {
    try {
        const selector = {
            selector: {
                gpa: {
                    $gte: minGPA
                },
                course: {
                    $in: courses
                }
            }
        };

        const result = await contract.evaluateTransaction('QueryHighPerformingStudents', JSON.stringify(selector));
        return JSON.parse(utf8Decoder.decode(result));
    } catch (error) {
        console.error('Error querying high performing students:', error);
        throw error;
    }
}

// API Routes for CouchDB Queries

app.get('/api/couchdb/health', (req, res) => {
    res.json({
        success: true,
        message: 'CouchDB Query API is running',
        timestamp: new Date().toISOString()
    });
});

// Query students by course
app.get('/api/couchdb/students/course/:course', async (req, res) => {
    try {
        const { course } = req.params;
        const result = await queryStudentsByCourse(course);
        res.json({
            success: true,
            data: result,
            query: `Students in course: ${course}`,
            count: result.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Query students by GPA range
app.get('/api/couchdb/students/gpa/:minGPA/:maxGPA', async (req, res) => {
    try {
        const { minGPA, maxGPA } = req.params;
        const result = await queryStudentsByGPARange(parseFloat(minGPA), parseFloat(maxGPA));
        res.json({
            success: true,
            data: result,
            query: `Students with GPA between ${minGPA} and ${maxGPA}`,
            count: result.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Query students by status and semester
app.get('/api/couchdb/students/status/:status/semester/:semester', async (req, res) => {
    try {
        const { status, semester } = req.params;
        const result = await queryStudentsByStatusAndSemester(status, parseInt(semester));
        res.json({
            success: true,
            data: result,
            query: `Students with status ${status} in semester ${semester}`,
            count: result.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Query students by name pattern
app.get('/api/couchdb/students/name/:pattern', async (req, res) => {
    try {
        const { pattern } = req.params;
        const result = await queryStudentsByNamePattern(pattern);
        res.json({
            success: true,
            data: result,
            query: `Students with name containing: ${pattern}`,
            count: result.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Complex query: High performing students
app.post('/api/couchdb/students/high-performing', async (req, res) => {
    try {
        const { minGPA, courses } = req.body;
        const result = await queryHighPerformingStudents(minGPA, courses);
        res.json({
            success: true,
            data: result,
            query: `High performing students (GPA >= ${minGPA}) in courses: ${courses.join(', ')}`,
            count: result.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Demo route to show all CouchDB query capabilities
app.get('/api/couchdb/demo', async (req, res) => {
    try {
        const demos = [
            {
                name: 'Students in Computer Science',
                url: '/api/couchdb/students/course/Computer Science',
                description: 'Find all students enrolled in Computer Science'
            },
            {
                name: 'Students with GPA 3.0-4.0',
                url: '/api/couchdb/students/gpa/3.0/4.0',
                description: 'Find students with GPA between 3.0 and 4.0'
            },
            {
                name: 'Active students in semester 1',
                url: '/api/couchdb/students/status/Active/semester/1',
                description: 'Find active students in first semester'
            },
            {
                name: 'Students with name containing "Kumar"',
                url: '/api/couchdb/students/name/Kumar',
                description: 'Find students with "Kumar" in their name'
            },
            {
                name: 'High performing students (POST)',
                url: '/api/couchdb/students/high-performing',
                method: 'POST',
                body: {
                    minGPA: 3.5,
                    courses: ['Computer Science', 'Electrical Engineering']
                },
                description: 'Find high performing students in specific courses'
            }
        ];

        res.json({
            success: true,
            message: 'CouchDB Query Demo Endpoints',
            demos: demos,
            note: 'These queries demonstrate CouchDB rich querying capabilities'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 CouchDB Query API server running on port ${PORT}`);
            console.log(`📊 CouchDB Web Interface: http://localhost:5984/_utils`);
            console.log(`🔍 Demo queries: http://localhost:${PORT}/api/couchdb/demo`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 