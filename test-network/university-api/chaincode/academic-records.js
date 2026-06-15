'use strict';

const { Contract } = require('fabric-contract-api');

class AcademicRecordsContract extends Contract {

    constructor() {
        super('AcademicRecordsContract');
    }

    /**
     * Initialize the ledger with sample academic records
     */
    async InitLedger(ctx) {
        console.log('Initializing Academic Records Ledger');
        
        const academicRecords = [
            {
                recordId: 'AR2024001',
                enrollmentNo: 'EN2024001',
                educationLevel: 'Bachelor',
                schoolOrCollegeName: 'Delhi Public School',
                boardOrUniversityName: 'CBSE',
                institutionAddress: '123 Education Street, Delhi',
                institutionCode: 'DPS001',
                startYear: '2016',
                endYear: '2018',
                passingYear: '2018',
                stream: 'Science',
                majorSubjects: 'Physics, Chemistry, Mathematics',
                optionalSubjects: 'Computer Science',
                percentage: '85.5',
                grade: 'A',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                recordId: 'AR2024002',
                enrollmentNo: 'EN2024002',
                educationLevel: 'Bachelor',
                schoolOrCollegeName: 'Mumbai International School',
                boardOrUniversityName: 'ICSE',
                institutionAddress: '456 Learning Avenue, Mumbai',
                institutionCode: 'MIS001',
                startYear: '2017',
                endYear: '2019',
                passingYear: '2019',
                stream: 'Commerce',
                majorSubjects: 'Accountancy, Business Studies, Economics',
                optionalSubjects: 'Mathematics',
                percentage: '88.2',
                grade: 'A+',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system'
            }
        ];

        for (const record of academicRecords) {
            await this.CreateAcademicRecord(ctx, JSON.stringify(record));
        }
        
        console.log('Academic Records Ledger initialized successfully');
    }

    /**
     * Create a new academic record (schemaless, only enrollmentNo required)
     */
    async CreateAcademicRecord(ctx, recordData) {
        try {
            const record = JSON.parse(recordData);

            // Require only enrollmentNo
            if (!record.enrollmentNo) {
                throw new Error('enrollmentNo is required');
            }

            // Check if record already exists
            const existingRecord = await this.GetAcademicRecordById(ctx, record.enrollmentNo);
            if (existingRecord) {
                throw new Error(`Academic record with enrollmentNo ${record.enrollmentNo} already exists`);
            }

            // Add metadata
            record.createdAt = new Date().toISOString();
            record.updatedAt = new Date().toISOString();
            record.createdBy = ctx.clientIdentity.getID();

            // Store academic record data (keyed by enrollmentNo)
            await ctx.stub.putState(record.enrollmentNo, Buffer.from(JSON.stringify(record)));

            // Composite key for queries (if needed)
            // Example: by educationLevel (if present)
            if (record.educationLevel) {
                const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [record.educationLevel, record.enrollmentNo]);
                await ctx.stub.putState(educationLevelKey, Buffer.from(record.enrollmentNo));
            }

            console.log(`Academic record ${record.enrollmentNo} created successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record created successfully',
                enrollmentNo: record.enrollmentNo
            });
        } catch (error) {
            console.error('Error creating academic record:', error);
            throw new Error(`Failed to create academic record: ${error.message}`);
        }
    }

    /**
     * Get academic record by enrollmentNo
     */
    async GetAcademicRecordById(ctx, enrollmentNo) {
        try {
            const recordBytes = await ctx.stub.getState(enrollmentNo);
            if (!recordBytes || recordBytes.length === 0) {
                return null;
            }
            return JSON.parse(recordBytes.toString());
        } catch (error) {
            console.error('Error getting academic record:', error);
            throw new Error(`Failed to get academic record: ${error.message}`);
        }
    }

    /**
     * Get academic records by enrollment number
     */
    async GetAcademicRecordsByEnrollment(ctx, enrollmentNo) {
        try {
            const enrollmentKey = ctx.stub.createCompositeKey('academic~enrollment', [enrollmentNo, '']);
            const iterator = await ctx.stub.getStateByPartialCompositeKey(enrollmentKey);
            const records = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const recordId = result.value.value.toString();
                    const record = await this.GetAcademicRecordById(ctx, recordId);
                    if (record) {
                        records.push(record);
                    }
                }
                if (result.done) {
                    break;
                }
            }

            await iterator.close();
            return records;
        } catch (error) {
            console.error('Error getting academic records by enrollment:', error);
            throw new Error(`Failed to get academic records: ${error.message}`);
        }
    }

    /**
     * Update academic record (schemaless, except enrollmentNo)
     */
    async UpdateAcademicRecord(ctx, enrollmentNo, updateData) {
        try {
            const record = await this.GetAcademicRecordById(ctx, enrollmentNo);
            if (!record) {
                throw new Error(`Academic record with enrollmentNo ${enrollmentNo} not found`);
            }

            const updates = JSON.parse(updateData);
            // Prevent changing enrollmentNo
            delete updates.enrollmentNo;

            // Merge updates into record
            Object.assign(record, updates);

            // Update metadata
            record.updatedAt = new Date().toISOString();
            record.updatedBy = ctx.clientIdentity.getID();

            // Store updated record data
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(record)));

            // Update composite key if educationLevel changed
            if (updates.educationLevel) {
                const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [updates.educationLevel, enrollmentNo]);
                await ctx.stub.putState(educationLevelKey, Buffer.from(enrollmentNo));
            }

            console.log(`Academic record ${enrollmentNo} updated successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record updated successfully',
                enrollmentNo: enrollmentNo
            });
        } catch (error) {
            console.error('Error updating academic record:', error);
            throw new Error(`Failed to update academic record: ${error.message}`);
        }
    }

    /**
     * Delete academic record by enrollmentNo
     */
    async DeleteAcademicRecord(ctx, enrollmentNo) {
        try {
            const record = await this.GetAcademicRecordById(ctx, enrollmentNo);
            if (!record) {
                throw new Error(`Academic record with enrollmentNo ${enrollmentNo} not found`);
            }

            // Delete the academic record
            await ctx.stub.deleteState(enrollmentNo);

            // Delete composite key if educationLevel present
            if (record.educationLevel) {
                const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [record.educationLevel, enrollmentNo]);
                await ctx.stub.deleteState(educationLevelKey);
            }

            console.log(`Academic record ${enrollmentNo} deleted successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record deleted successfully',
                enrollmentNo: enrollmentNo
            });
        } catch (error) {
            console.error('Error deleting academic record:', error);
            throw new Error(`Failed to delete academic record: ${error.message}`);
        }
    }

    /**
     * Get all academic records (schemaless)
     */
    async GetAllAcademicRecords(ctx) {
        try {
            const startKey = '';
            const endKey = '';
            const iterator = await ctx.stub.getStateByRange(startKey, endKey);
            const records = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const record = JSON.parse(result.value.value.toString());
                    // Only include records with enrollmentNo
                    if (record.enrollmentNo) {
                        records.push(record);
                    }
                }
                if (result.done) {
                    break;
                }
            }

            await iterator.close();
            return records;
        } catch (error) {
            console.error('Error getting all academic records:', error);
            throw new Error(`Failed to get academic records: ${error.message}`);
        }
    }

    /**
     * Get academic records by education level
     */
    async GetAcademicRecordsByEducationLevel(ctx, educationLevel) {
        try {
            const levelKey = ctx.stub.createCompositeKey('academic~level', [educationLevel, '']);
            const iterator = await ctx.stub.getStateByPartialCompositeKey(levelKey);
            const records = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const recordId = result.value.value.toString();
                    const record = await this.GetAcademicRecordById(ctx, recordId);
                    if (record) {
                        records.push(record);
                    }
                }
                if (result.done) {
                    break;
                }
            }

            await iterator.close();
            return records;
        } catch (error) {
            console.error('Error getting academic records by education level:', error);
            throw new Error(`Failed to get academic records: ${error.message}`);
        }
    }

    /**
     * Search academic records by institution name
     */
    async SearchAcademicRecordsByInstitution(ctx, searchTerm) {
        try {
            const startKey = '';
            const endKey = '';
            const iterator = await ctx.stub.getStateByRange(startKey, endKey);
            const records = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const record = JSON.parse(result.value.value.toString());
                    // Only include academic records and check institution name
                    if (record.recordId && record.recordId.startsWith('AR')) {
                        const institutionName = record.schoolOrCollegeName || '';
                        const boardName = record.boardOrUniversityName || '';
                        
                        if (institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            boardName.toLowerCase().includes(searchTerm.toLowerCase())) {
                            records.push(record);
                        }
                    }
                }
                if (result.done) {
                    break;
                }
            }

            await iterator.close();
            return records;
        } catch (error) {
            console.error('Error searching academic records:', error);
            throw new Error(`Failed to search academic records: ${error.message}`);
        }
    }

    /**
     * Get academic record history
     */
    async GetAcademicRecordHistory(ctx, recordId) {
        try {
            const iterator = await ctx.stub.getHistoryForKey(recordId);
            const history = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const record = {
                        txId: result.value.txId,
                        timestamp: new Date(result.value.timestamp.seconds.low * 1000).toISOString(),
                        isDelete: result.value.isDelete,
                        value: result.value.isDelete ? null : JSON.parse(result.value.value.toString())
                    };
                    history.push(record);
                }
                if (result.done) {
                    break;
                }
            }

            await iterator.close();
            return history;
        } catch (error) {
            console.error('Error getting academic record history:', error);
            throw new Error(`Failed to get academic record history: ${error.message}`);
        }
    }

    /**
     * Get academic statistics
     */
    async GetAcademicStatistics(ctx) {
        try {
            const records = await this.GetAllAcademicRecords(ctx);
            
            const statistics = {
                totalRecords: records.length,
                byEducationLevel: {},
                byStream: {},
                averagePercentage: 0,
                gradeDistribution: {}
            };

            let totalPercentage = 0;
            let validPercentages = 0;

            records.forEach(record => {
                // Count by education level
                const level = record.educationLevel || 'Unknown';
                statistics.byEducationLevel[level] = (statistics.byEducationLevel[level] || 0) + 1;

                // Count by stream
                const stream = record.stream || 'Unknown';
                statistics.byStream[stream] = (statistics.byStream[stream] || 0) + 1;

                // Calculate average percentage
                if (record.percentage && !isNaN(parseFloat(record.percentage))) {
                    totalPercentage += parseFloat(record.percentage);
                    validPercentages++;
                }

                // Count by grade
                const grade = record.grade || 'Unknown';
                statistics.gradeDistribution[grade] = (statistics.gradeDistribution[grade] || 0) + 1;
            });

            if (validPercentages > 0) {
                statistics.averagePercentage = (totalPercentage / validPercentages).toFixed(2);
            }

            return statistics;
        } catch (error) {
            console.error('Error getting academic statistics:', error);
            throw new Error(`Failed to get academic statistics: ${error.message}`);
        }
    }
}

module.exports = AcademicRecordsContract; 