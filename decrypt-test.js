const crypto = require('crypto');

// AES Configuration
const AES_KEY = '1234567890123456'; // 16 bytes
const AES_IV = '6543210987654321';  // 16 bytes

function decryptAES(encryptedData) {
    try {
        const encryptedBuffer = Buffer.from(encryptedData, 'base64');
        const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
        let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('AES Decryption failed:', error);
        throw new Error('Failed to decrypt QR code data');
    }
}

// Test encrypted data
const testEncryptedData = "wAPbnX7vhHfcNuxo6nxUwhLOGEqHb9aDhx5uUCibqT0CtfoAhUieNizG%2F31dQq9qvZaaHkcIfvth4beoAmP1kt7d%2F5RizZmdbzNFo%2FfRv%2BnRgjck7Yap8RtIwgwiNcZJBFF0cB5XcSNFwqx%2BSU4W2RMb8hvgH8Z9OKJOOsGN7g%2FuPXl4ZyuRsFP2buVgS5FWCH6EKunB1jC5IAURXL5IlEl3d%2F4F5pUIFHjfE2uQMglPnLh1%2FXJPJZJeyfeQHbk2";

try {
    // URL decode first
    const decodedData = decodeURIComponent(testEncryptedData);
    console.log('URL Decoded Data:', decodedData.substring(0, 100) + '...');
    
    // Decrypt
    const decryptedData = decryptAES(decodedData);
    console.log('\nDecrypted QR Data:');
    console.log(decryptedData);
    
    // Parse JSON
    const qrData = JSON.parse(decryptedData);
    console.log('\nParsed QR Data:');
    console.log(JSON.stringify(qrData, null, 2));
    
} catch (error) {
    console.error('Error:', error.message);
}
