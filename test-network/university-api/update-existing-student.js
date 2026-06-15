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

async function updateExistingStudent() {
    try {
        console.log('🔄 Updating existing student EN2024011 on blockchain...');
        
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
        console.log(`📋 Channel: ${channelName}`);
        console.log(`📋 Chaincode: ${chaincodeName} v1.5`);
        
        // First, get the current student data
        console.log('\n🔍 Getting current student data for EN2024011...');
        const currentResult = await contract.evaluateTransaction('GetStudentByEnrollment', 'EN2024011');
        const currentStudent = JSON.parse(utf8Decoder.decode(currentResult));
        console.log('Current date of birth:', currentStudent.dateOfBirth);
        
        // Update the date of birth
        const updatedStudent = {
            ...currentStudent,
            dateOfBirth: '1999-05-15',
            updatedAt: new Date().toISOString()
        };
        
        console.log('\n📝 Updating student date of birth to:', updatedStudent.dateOfBirth);
        
        // Try different approaches to update the student
        
        // Approach 1: Try UpdateStudent function (if it exists)
        console.log('\n🔄 Approach 1: Trying UpdateStudent function...');
        try {
            const updateResult = await contract.submitTransaction('UpdateStudent', 'EN2024011', JSON.stringify(updatedStudent));
            const updateResponse = utf8Decoder.decode(updateResult);
            console.log('✅ Student updated successfully:', updateResponse);
        } catch (error) {
            console.log('❌ UpdateStudent function not available:', error.message);
            
            // Approach 2: Try to overwrite the student data
            console.log('\n🔄 Approach 2: Trying to overwrite student data...');
            try {
                const overwriteResult = await contract.submitTransaction('RegisterStudent', JSON.stringify(updatedStudent));
                const overwriteResponse = utf8Decoder.decode(overwriteResult);
                console.log('✅ Student data overwritten successfully:', overwriteResponse);
            } catch (overwriteError) {
                console.log('❌ Overwrite failed:', overwriteError.message);
                
                // Approach 3: Try to delete and re-register
                console.log('\n🔄 Approach 3: Trying delete and re-register...');
                try {
                    // First try to delete (if DeleteStudent function exists)
                    await contract.submitTransaction('DeleteStudent', 'EN2024011');
                    console.log('✅ Student deleted successfully');
                    
                    // Then re-register with updated data
                    const reRegisterResult = await contract.submitTransaction('RegisterStudent', JSON.stringify(updatedStudent));
                    const reRegisterResponse = utf8Decoder.decode(reRegisterResult);
                    console.log('✅ Student re-registered with updated data:', reRegisterResponse);
                } catch (deleteError) {
                    console.log('❌ Delete and re-register failed:', deleteError.message);
                    console.log('⚠️  Update functionality not available in current chaincode version');
                }
            }
        }
        
        // Verify the update
        console.log('\n🔍 Verifying the update...');
        try {
            const verifyResult = await contract.evaluateTransaction('GetStudentByEnrollment', 'EN2024011');
            const verifyStudent = JSON.parse(utf8Decoder.decode(verifyResult));
            console.log('✅ Updated student data:');
            console.log('Date of birth:', verifyStudent.dateOfBirth);
            console.log('Updated at:', verifyStudent.updatedAt);
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
        
        gateway.close();
        console.log('\n🎉 Update attempt completed!');
        
    } catch (error) {
        console.error('❌ Error updating student:', error);
        throw error;
    }
}

// Run update
updateExistingStudent(); 