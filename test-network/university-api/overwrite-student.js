const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

// Blockchain Configuration
const channelName = 'university';
const chaincodeName = 'studentadmission';
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

async function overwriteStudent() {
    try {
        console.log('🔄 Attempting to overwrite student EN2024011 with updated data...');
        
        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        
        console.log('✅ Connected to blockchain');
        
        // Get current student data
        console.log('\n🔍 Getting current student data...');
        const currentResult = await contract.evaluateTransaction('GetStudentByEnrollment', 'EN2024011');
        const currentStudent = JSON.parse(utf8Decoder.decode(currentResult));
        console.log('Current date of birth:', currentStudent.dateOfBirth);
        
        // Create updated student data
        const updatedStudent = {
            enrollmentNo: 'EN2024011',
            firstName: 'Real',
            lastName: 'Blockchain',
            fathersName: 'Test Father',
            mothersName: 'Test Mother',
            dateOfBirth: '1999-05-15', // Updated date of birth
            phoneNo: '+91-1234567890',
            email: 'real.blockchain@email.com',
            address: '123 Blockchain Street',
            course: 'Computer Science',
            admissionDate: '2024-06-01',
            status: 'Active',
            semester: 1,
            gpa: 0,
            documents: ['Aadhar Card', '10th Certificate', '12th Certificate'],
            createdAt: currentStudent.createdAt, // Preserve original creation date
            updatedAt: new Date().toISOString() // Update the timestamp
        };
        
        console.log('\n📝 Attempting to register with updated data...');
        console.log('New date of birth:', updatedStudent.dateOfBirth);
        
        try {
            const result = await contract.submitTransaction('RegisterStudent', JSON.stringify(updatedStudent));
            const response = utf8Decoder.decode(result);
            console.log('✅ Student data overwritten successfully:', response);
            
            // Verify the update
            console.log('\n🔍 Verifying the update...');
            const verifyResult = await contract.evaluateTransaction('GetStudentByEnrollment', 'EN2024011');
            const verifyStudent = JSON.parse(utf8Decoder.decode(verifyResult));
            console.log('✅ Updated student data:');
            console.log('Date of birth:', verifyStudent.dateOfBirth);
            console.log('Updated at:', verifyStudent.updatedAt);
            
        } catch (error) {
            console.error('❌ Failed to overwrite student data:', error.message);
            console.log('⚠️  The chaincode may have validation that prevents overwriting existing students');
        }
        
        gateway.close();
        console.log('\n🎉 Overwrite attempt completed!');
        
    } catch (error) {
        console.error('❌ Error overwriting student:', error);
        throw error;
    }
}

// Run overwrite
overwriteStudent(); 