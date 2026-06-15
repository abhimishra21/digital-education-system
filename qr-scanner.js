/**
 * QR Code Scanner and Marksheet Display
 * Include this script in your result.html and no-records-found.html pages
 */

class QRScanner {
    constructor() {
        this.apiBaseUrl = 'http://135.235.51.143:3002/api/academic';
        this.init();
    }

    init() {
        // Check if we have encrypted data in URL
        const urlParams = new URLSearchParams(window.location.search);
        const encryptedData = urlParams.get('data');
        
        if (encryptedData) {
            this.handleEncryptedQR(encryptedData);
        } else {
            console.log('No encrypted data found in URL');
        }
    }

    async handleEncryptedQR(encryptedData) {
        try {
            console.log('Processing encrypted QR data...');
            
            // Call the backend decryption API
            const response = await this.decryptQRData(encryptedData);
            
            if (response.success && response.data) {
                this.displayMarksheet(response.data);
            } else {
                this.showNoRecordsFound(response.error || 'No records found');
            }
        } catch (error) {
            console.error('Failed to process QR data:', error);
            this.showNoRecordsFound('Failed to process QR code data');
        }
    }

    async decryptQRData(encryptedData) {
        const url = `${this.apiBaseUrl}/records/decrypt-url?data=${encodeURIComponent(encryptedData)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return data;
    }

    displayMarksheet(recordData) {
        const { data: primaryRecord, allSemesters, source, qrData } = recordData;
        
        console.log('Displaying marksheet for:', primaryRecord);
        console.log('Decrypted QR data:', qrData);
        
        // Update the page with the actual record data
        this.updatePageContent(primaryRecord, allSemesters);
        
        // Show success message
        this.showMessage('Marksheet loaded successfully!', 'success');
    }

    updatePageContent(primaryRecord, allSemesters) {
        // Update student details
        this.updateField('serialNumber', primaryRecord.serialNumber || '');
        this.updateField('examRollNumber', primaryRecord.examRollNumber || '');
        this.updateField('candidateName', primaryRecord.candidate?.name || '');
        this.updateField('fatherName', primaryRecord.candidate?.fatherName || '');
        this.updateField('motherName', primaryRecord.candidate?.motherName || '');
        this.updateField('dateOfBirth', primaryRecord.candidate?.dateOfBirth || '');
        this.updateField('registrationNumber', primaryRecord.candidate?.registrationNumber || '');
        
        // Update examination details
        this.updateField('examinationName', primaryRecord.examination?.name || '');
        this.updateField('semester', primaryRecord.examination?.semester || '');
        this.updateField('examType', primaryRecord.examination?.examType || '');
        this.updateField('capacity', primaryRecord.examination?.capacity || '');
        this.updateField('collegeName', primaryRecord.examination?.collegeName || '');
        this.updateField('examCenterName', primaryRecord.examination?.examCenterName || '');
        this.updateField('examMonthYear', primaryRecord.examination?.examMonthYear || '');
        
        // Update result details
        this.updateField('resultStatus', primaryRecord.resultSummary?.result || '');
        this.updateField('totalMarks', primaryRecord.resultSummary?.totalMarks || '');
        
        // Update marks table if it exists
        this.updateMarksTable(primaryRecord.marksDetails);
        
        // Show all semesters if multiple exist
        if (allSemesters && allSemesters.length > 1) {
            this.showAllSemesters(allSemesters);
        }
    }

    updateField(fieldName, value) {
        const element = document.getElementById(fieldName) || 
                       document.querySelector(`[data-field="${fieldName}"]`) ||
                       document.querySelector(`.${fieldName}`);
        
        if (element) {
            element.textContent = value;
        }
    }

    updateMarksTable(marksDetails) {
        if (!marksDetails || !Array.isArray(marksDetails)) return;
        
        const tableBody = document.querySelector('table tbody');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Add new rows
        marksDetails.forEach((mark, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${mark.paperCode || ''}</td>
                <td>${mark.paperName || ''}</td>
                <td>${mark.category || ''}</td>
                <td>${mark.marksObtained?.TH || '-'}</td>
                <td>${mark.marksObtained?.IA || '-'}</td>
                <td>${mark.marksObtained?.PR || '-'}</td>
                <td>${mark.marksObtained?.GR || '-'}</td>
                <td>${mark.marksObtained?.TOTAL || '-'}</td>
                <td>${mark.minimumPassingMarks || ''}</td>
                <td>${mark.maximumMarks || ''}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    showAllSemesters(allSemesters) {
        // Create a section to show all semesters
        const container = document.createElement('div');
        container.className = 'all-semesters-section';
        container.innerHTML = `
            <h3>All Semester Records</h3>
            <div class="semester-list">
                ${allSemesters.map(semester => `
                    <div class="semester-item">
                        <strong>${semester.examination?.semester || 'Unknown Semester'}</strong>
                        - ${semester.resultSummary?.result || 'No Result'}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add to page
        document.body.appendChild(container);
    }

    showNoRecordsFound(message) {
        // Update the page to show no records found
        const content = document.querySelector('.content') || document.body;
        content.innerHTML = `
            <div class="no-records-found">
                <h2>No Records Found</h2>
                <p>${message}</p>
                <p>The scanned QR code data is not currently available in our system. This could be due to the record not being processed yet or the data being temporarily unavailable.</p>
                <p><strong>QR Code Information:</strong> Unable to retrieve QR code details</p>
                <p>This is a Computer generated document. Please contact the examination department if you believe this is an error or if you need assistance.</p>
            </div>
        `;
    }

    showMessage(message, type = 'info') {
        // Create a notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize QR Scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.qrScanner = new QRScanner();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.qrScanner = new QRScanner();
    });
} else {
    window.qrScanner = new QRScanner();
}
