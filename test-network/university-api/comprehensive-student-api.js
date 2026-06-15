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
const chaincodeVersion = '2.0';
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
        
        console.log('✅ Comprehensive Student Admission Blockchain connection established');
        console.log(`📋 Connected to chaincode: ${chaincodeName} version ${chaincodeVersion}`);
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
        message: 'Comprehensive Student Admission API is running',
        timestamp: new Date().toISOString(),
        blockchainInfo: {
            channel: channelName,
            chaincode: chaincodeName,
            version: chaincodeVersion
        }
    });
});

// 2. Initialize Ledger
app.post('/api/admin/init-ledger', async (req, res) => {
    try {
        console.log('🔧 Initializing ledger with sample data...');
        
        const result = await contract.submitTransaction('InitLedger');
        const response = utf8Decoder.decode(result);
        
        console.log('✅ Ledger initialized successfully');
        
        res.json({
            success: true,
            message: 'Ledger initialized successfully',
            data: response
        });
    } catch (error) {
        console.error('❌ Error initializing ledger:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize ledger',
            error: error.message
        });
    }
});

// 3. Search Student by Enrollment Number
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

// 4. Register New Student
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
        const createdStudent = JSON.parse(response);
        
        console.log(`✅ Student registered successfully: ${studentData.enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student registered successfully',
            data: createdStudent
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

// 5. Update Student Information
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
        
        const result = await contract.submitTransaction('UpdateStudent', enrollmentNo, JSON.stringify(updateData));
        const response = utf8Decoder.decode(result);
        const updatedStudent = JSON.parse(response);
        
        console.log(`✅ Student updated successfully: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student updated successfully',
            data: updatedStudent
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

// 6. Delete Student
app.delete('/api/students/:enrollmentNo', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        
        if (!enrollmentNo) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number is required'
            });
        }

        console.log(`🗑️ Deleting student: ${enrollmentNo}`);
        
        const result = await contract.submitTransaction('DeleteStudent', enrollmentNo);
        const response = utf8Decoder.decode(result);
        
        console.log(`✅ Student deleted successfully: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student deleted successfully',
            data: JSON.parse(response)
        });
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student',
            error: error.message
        });
    }
});

// 7. Get All Students
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

// 8. Get Students by Course
app.get('/api/students/course/:course', async (req, res) => {
    try {
        const { course } = req.params;
        
        if (!course) {
            return res.status(400).json({
                success: false,
                message: 'Course is required'
            });
        }

        console.log(`📚 Getting students for course: ${course}`);
        
        const result = await contract.evaluateTransaction('GetStudentsByCourse', course);
        const studentsData = utf8Decoder.decode(result);
        
        console.log(`✅ Retrieved students for course: ${course}`);
        
        res.json({
            success: true,
            message: `Students for course ${course} retrieved successfully`,
            data: JSON.parse(studentsData)
        });
    } catch (error) {
        console.error('❌ Error getting students by course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students by course',
            error: error.message
        });
    }
});

// 9. Search Students by Name
app.get('/api/students/search/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        
        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: 'Search term is required'
            });
        }

        console.log(`🔍 Searching students by name: ${searchTerm}`);
        
        const result = await contract.evaluateTransaction('SearchStudentsByName', searchTerm);
        const studentsData = utf8Decoder.decode(result);
        
        console.log(`✅ Search completed for: ${searchTerm}`);
        
        res.json({
            success: true,
            message: `Search results for "${searchTerm}"`,
            data: JSON.parse(studentsData)
        });
    } catch (error) {
        console.error('❌ Error searching students by name:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search students by name',
            error: error.message
        });
    }
});

// 10. Update Student GPA
app.put('/api/students/:enrollmentNo/gpa', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const { gpa } = req.body;
        
        if (!enrollmentNo || gpa === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number and GPA are required'
            });
        }

        console.log(`📊 Updating GPA for student: ${enrollmentNo} to ${gpa}`);
        
        const result = await contract.submitTransaction('UpdateStudentGPA', enrollmentNo, gpa.toString());
        const response = utf8Decoder.decode(result);
        
        console.log(`✅ GPA updated successfully for student: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'GPA updated successfully',
            data: JSON.parse(response)
        });
    } catch (error) {
        console.error('❌ Error updating GPA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update GPA',
            error: error.message
        });
    }
});

// 11. Transfer Student Course
app.put('/api/students/:enrollmentNo/transfer', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        const { newCourse } = req.body;
        
        if (!enrollmentNo || !newCourse) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number and new course are required'
            });
        }

        console.log(`🔄 Transferring student ${enrollmentNo} to course: ${newCourse}`);
        
        const result = await contract.submitTransaction('TransferStudentCourse', enrollmentNo, newCourse);
        const response = utf8Decoder.decode(result);
        
        console.log(`✅ Student transferred successfully: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student transferred successfully',
            data: JSON.parse(response)
        });
    } catch (error) {
        console.error('❌ Error transferring student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer student',
            error: error.message
        });
    }
});

// 12. Get Student Statistics
app.get('/api/students/statistics', async (req, res) => {
    try {
        console.log('📊 Getting student statistics...');
        
        const result = await contract.evaluateTransaction('GetStudentStatistics');
        const statsData = utf8Decoder.decode(result);
        
        console.log('✅ Student statistics retrieved successfully');
        
        res.json({
            success: true,
            message: 'Student statistics retrieved successfully',
            data: JSON.parse(statsData)
        });
    } catch (error) {
        console.error('❌ Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// 13. Get Students by Status
app.get('/api/students/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        console.log(`📋 Getting students with status: ${status}`);
        
        const result = await contract.evaluateTransaction('GetStudentsByStatus', status);
        const studentsData = utf8Decoder.decode(result);
        
        console.log(`✅ Retrieved students with status: ${status}`);
        
        res.json({
            success: true,
            message: `Students with status ${status} retrieved successfully`,
            data: JSON.parse(studentsData)
        });
    } catch (error) {
        console.error('❌ Error getting students by status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students by status',
            error: error.message
        });
    }
});

// 14. Get Students by Semester
app.get('/api/students/semester/:semester', async (req, res) => {
    try {
        const { semester } = req.params;
        
        if (!semester) {
            return res.status(400).json({
                success: false,
                message: 'Semester is required'
            });
        }

        console.log(`📚 Getting students in semester: ${semester}`);
        
        const result = await contract.evaluateTransaction('GetStudentsBySemester', semester);
        const studentsData = utf8Decoder.decode(result);
        
        console.log(`✅ Retrieved students in semester: ${semester}`);
        
        res.json({
            success: true,
            message: `Students in semester ${semester} retrieved successfully`,
            data: JSON.parse(studentsData)
        });
    } catch (error) {
        console.error('❌ Error getting students by semester:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students by semester',
            error: error.message
        });
    }
});

// 15. Get Student History (for audit trail)
app.get('/api/students/:enrollmentNo/history', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        
        if (!enrollmentNo) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number is required'
            });
        }

        console.log(`📜 Getting history for student: ${enrollmentNo}`);
        
        // First check if student exists
        const studentResult = await contract.evaluateTransaction('GetStudentByEnrollment', enrollmentNo);
        const studentData = utf8Decoder.decode(studentResult);
        
        if (!studentData || studentData === 'null') {
            return res.status(404).json({
                success: false,
                message: `Student with enrollment number ${enrollmentNo} not found`
            });
        }

        const student = JSON.parse(studentData);
        
        // Get complete student history from chaincode
        const historyResult = await contract.evaluateTransaction('GetCompleteStudentHistory', enrollmentNo);
        const historyData = JSON.parse(utf8Decoder.decode(historyResult));
        
        const history = historyData.history;
        
        const response = {
            enrollmentNo: student.enrollmentNo,
            currentData: student,
            history: history,
            totalRecords: history.length
        };
        
        console.log(`✅ Retrieved history for student: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student history retrieved successfully',
            data: response
        });
    } catch (error) {
        console.error('❌ Error getting student history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student history',
            error: error.message
        });
    }
});

// 16. Get Student Audit Trail (detailed history)
app.get('/api/students/:enrollmentNo/audit', async (req, res) => {
    try {
        const { enrollmentNo } = req.params;
        
        if (!enrollmentNo) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number is required'
            });
        }

        console.log(`🔍 Getting audit trail for student: ${enrollmentNo}`);
        
        // First check if student exists
        const studentResult = await contract.evaluateTransaction('GetStudentByEnrollment', enrollmentNo);
        const studentData = utf8Decoder.decode(studentResult);
        
        if (!studentData || studentData === 'null') {
            return res.status(404).json({
                success: false,
                message: `Student with enrollment number ${enrollmentNo} not found`
            });
        }

        const student = JSON.parse(studentData);
        
        const auditTrail = {
            enrollmentNo: student.enrollmentNo,
            studentName: `${student.firstName} ${student.lastName}`,
            auditEvents: [
                {
                    eventType: 'STUDENT_CREATED',
                    timestamp: student.createdAt,
                    details: 'Student record created',
                    data: student
                },
                {
                    eventType: 'STUDENT_UPDATED',
                    timestamp: student.updatedAt,
                    details: 'Student record last updated',
                    data: student
                }
            ],
            summary: {
                totalEvents: 2,
                lastModified: student.updatedAt,
                createdOn: student.createdAt
            }
        };
        
        console.log(`✅ Retrieved audit trail for student: ${enrollmentNo}`);
        
        res.json({
            success: true,
            message: 'Student audit trail retrieved successfully',
            data: auditTrail
        });
    } catch (error) {
        console.error('❌ Error getting student audit trail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student audit trail',
            error: error.message
        });
    }
});

// 17. Search Students with Advanced Filters
app.get('/api/students/search', async (req, res) => {
    try {
        const { 
            enrollmentNo, 
            firstName, 
            lastName, 
            course, 
            status, 
            semester,
            minGpa,
            maxGpa 
        } = req.query;

        console.log(`🔍 Advanced search with filters:`, req.query);
        
        // Get all students first, then filter
        const result = await contract.evaluateTransaction('GetAllStudents');
        const studentsData = utf8Decoder.decode(result);
        const allStudents = JSON.parse(studentsData);
        
        let filteredStudents = allStudents;
        
        // Apply filters
        if (enrollmentNo) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.enrollmentNo && student.Record.enrollmentNo.toLowerCase().includes(enrollmentNo.toLowerCase())
            );
        }
        
        if (firstName) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.firstName && student.Record.firstName.toLowerCase().includes(firstName.toLowerCase())
            );
        }
        
        if (lastName) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.lastName && student.Record.lastName.toLowerCase().includes(lastName.toLowerCase())
            );
        }
        
        if (course) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.course && student.Record.course.toLowerCase().includes(course.toLowerCase())
            );
        }
        
        if (status) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.status && student.Record.status.toLowerCase() === status.toLowerCase()
            );
        }
        
        if (semester) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.semester && student.Record.semester === parseInt(semester)
            );
        }
        
        if (minGpa) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.gpa && parseFloat(student.Record.gpa) >= parseFloat(minGpa)
            );
        }
        
        if (maxGpa) {
            filteredStudents = filteredStudents.filter(student => 
                student.Record.gpa && parseFloat(student.Record.gpa) <= parseFloat(maxGpa)
            );
        }
        
        console.log(`✅ Advanced search completed. Found ${filteredStudents.length} students`);
        
        res.json({
            success: true,
            message: 'Advanced search completed successfully',
            data: {
                students: filteredStudents,
                totalCount: filteredStudents.length,
                filters: req.query
            }
        });
    } catch (error) {
        console.error('❌ Error in advanced search:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform advanced search',
            error: error.message
        });
    }
});

// Start server
async function startServer() {
    try {
        await initializeBlockchain();
        
        app.listen(PORT, () => {
            console.log(`🚀 Comprehensive Student Admission API server running on port ${PORT}`);
            console.log(`📋 Complete API Documentation:`);
            console.log(`   GET  /api/health - Health check`);
            console.log(`   POST /api/admin/init-ledger - Initialize ledger with sample data`);
            console.log(`   GET  /api/students/enrollment/:enrollmentNo - Search student by enrollment number`);
            console.log(`   POST /api/students/register - Register new student`);
            console.log(`   PUT  /api/students/:enrollmentNo - Update student information`);
            console.log(`   DELETE /api/students/:enrollmentNo - Delete student`);
            console.log(`   GET  /api/students - Get all students`);
            console.log(`   GET  /api/students/course/:course - Get students by course`);
            console.log(`   GET  /api/students/search/:searchTerm - Search students by name`);
            console.log(`   GET  /api/students/search - Advanced search with filters`);
            console.log(`   PUT  /api/students/:enrollmentNo/gpa - Update student GPA`);
            console.log(`   PUT  /api/students/:enrollmentNo/transfer - Transfer student to different course`);
            console.log(`   GET  /api/students/statistics - Get student statistics`);
            console.log(`   GET  /api/students/status/:status - Get students by status`);
            console.log(`   GET  /api/students/semester/:semester - Get students by semester`);
            console.log(`   GET  /api/students/:enrollmentNo/history - Get student history`);
            console.log(`   GET  /api/students/:enrollmentNo/audit - Get student audit trail`);
            console.log('');
            console.log(`🔗 Blockchain Channel: ${channelName}`);
            console.log(`🔗 Chaincode: ${chaincodeName} v${chaincodeVersion}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 
