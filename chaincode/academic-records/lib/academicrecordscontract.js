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
            // Only require enrollmentNo
            if (!record.enrollmentNo) {
                throw new Error('enrollmentNo is required');
            }
            
            // Check for duplicate based on ALL fields: enrollmentNo, cycle, examMonth, examYear, examType, resultHash
            const uniqueParts = [
                record.enrollmentNo,
                record.cycle,
                record.examMonth,
                record.examYear,
                record.examType,
                record.resultHash
            ];
            
            // Check if all required fields are present for duplicate checking
            const hasAllUniqueParts = uniqueParts.every(v => v !== undefined && v !== null && `${v}`.trim() !== '');
            
            if (hasAllUniqueParts) {
                // Create unique key for duplicate checking
                const uniqueKey = ctx.stub.createCompositeKey('academic~unique', uniqueParts.map(v => `${v}`));
                const existingUnique = await ctx.stub.getState(uniqueKey);
                
                if (existingUnique && existingUnique.length > 0) {
                    throw new Error('Duplicate record detected. A record with the same Enrollment No, Cycle, Exam Month, Exam Year, Exam Type and Result Hash already exists.');
                }
            }
            
            // Create a composite key for storing the record (allows multiple records per student)
            const compositeKey = ctx.stub.createCompositeKey('academic~student~semester', [
                record.enrollmentNo,
                record.cycle || 'UNKNOWN',
                record.examMonth || 'UNKNOWN',
                record.examYear || 'UNKNOWN'
            ]);
            
            // Add metadata using deterministic transaction timestamp
            const txTimestamp = ctx.stub.getTxTimestamp();
            const timestampMs = (txTimestamp.seconds.low * 1000) + Math.floor(txTimestamp.nanos / 1e6);
            const txTimeIso = new Date(timestampMs).toISOString();
            record.createdAt = txTimeIso;
            record.updatedAt = txTimeIso;
            record.createdBy = ctx.clientIdentity.getID();
            
            // Store academic record data using composite key (per-semester)
            await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(record)));
            
            // Also store with enrollmentNo as key for backward compatibility (will be overwritten for multiple records)
            await ctx.stub.putState(record.enrollmentNo, Buffer.from(JSON.stringify(record)));
            
            // Composite key for queries (if needed)
            if (record.educationLevel) {
                const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [record.educationLevel, record.enrollmentNo]);
                await ctx.stub.putState(educationLevelKey, Buffer.from(record.enrollmentNo));
            }
            
            // Persist unique composite index if all parts present
            if (hasAllUniqueParts) {
                const uniqueKey = ctx.stub.createCompositeKey('academic~unique', uniqueParts.map(v => `${v}`));
                await ctx.stub.putState(uniqueKey, Buffer.from(record.enrollmentNo));
            }
            
            console.log(`Academic record ${record.enrollmentNo} created successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record created successfully',
                enrollmentNo: record.enrollmentNo,
                compositeKey: compositeKey
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
     * Get all academic records for a student by enrollmentNo
     */
    async GetAcademicRecordsByEnrollment(ctx, enrollmentNo) {
        try {
            const iterator = await ctx.stub.getStateByPartialCompositeKey('academic~student~semester', [enrollmentNo]);
            const records = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const record = JSON.parse(result.value.value.toString());
                    records.push(record);
                }
                if (result.done) {
                    break;
                }
            }

            await iterator.close();
            return records;
        } catch (error) {
            console.error('Error getting academic records by enrollment:', error);
            throw new Error(`Failed to get academic records by enrollment: ${error.message}`);
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
            const before = { ...record };
            Object.assign(record, updates);
            // Update metadata using deterministic transaction timestamp
            const txTimestamp = ctx.stub.getTxTimestamp();
            const timestampMs = (txTimestamp.seconds.low * 1000) + Math.floor(txTimestamp.nanos / 1e6);
            record.updatedAt = new Date(timestampMs).toISOString();
            record.updatedBy = ctx.clientIdentity.getID();
            // Handle per-semester composite key updates to avoid stale duplicate entries
            const beforeSemesterParts = [
                before.enrollmentNo,
                before.cycle || 'UNKNOWN',
                before.examMonth || 'UNKNOWN',
                before.examYear || 'UNKNOWN'
            ];
            const afterSemesterParts = [
                record.enrollmentNo,
                record.cycle || 'UNKNOWN',
                record.examMonth || 'UNKNOWN',
                record.examYear || 'UNKNOWN'
            ];
            const beforeSemesterKey = ctx.stub.createCompositeKey('academic~student~semester', beforeSemesterParts.map(v => `${v}`));
            const afterSemesterKey = ctx.stub.createCompositeKey('academic~student~semester', afterSemesterParts.map(v => `${v}`));
            // Manage unique composite index
            const beforeUniqueParts = [
                before.enrollmentNo,
                before.cycle,
                before.examMonth,
                before.examYear,
                before.examType,
                before.resultHash
            ];
            const afterUniqueParts = [
                record.enrollmentNo,
                record.cycle,
                record.examMonth,
                record.examYear,
                record.examType,
                record.resultHash
            ];
            const hadUnique = beforeUniqueParts.every(v => v !== undefined && v !== null && `${v}`.trim() !== '');
            const hasUnique = afterUniqueParts.every(v => v !== undefined && v !== null && `${v}`.trim() !== '');
            const uniqueChanged = hadUnique && hasUnique && beforeUniqueParts.map(v => `${v}`).join('|') !== afterUniqueParts.map(v => `${v}`).join('|');
            if (hasUnique) {
                const newUniqueKey = ctx.stub.createCompositeKey('academic~unique', afterUniqueParts.map(v => `${v}`));
                // If the key changed, ensure the new combo doesn't already exist
                if (!hadUnique || uniqueChanged) {
                    const exists = await ctx.stub.getState(newUniqueKey);
                    if (exists && exists.length > 0) {
                        throw new Error('Duplicate record detected for the same Enrollment No, Cycle, Exam Month, Exam Year, Exam Type and Result Hash');
                    }
                }
            }
            // Store updated record data
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(record)));
            // If semester key changed, delete old key to prevent old+new duplicates
            const semesterChanged = beforeSemesterParts.map(v => `${v}`).join('|') !== afterSemesterParts.map(v => `${v}`).join('|');
            // Do not delete the previous semester entry; preserve historical semester records
            // If semester changed, the write below will create a new per-semester record
            // Always write the latest record to the (possibly new) semester composite key
            await ctx.stub.putState(afterSemesterKey, Buffer.from(JSON.stringify(record)));
            // Update composite key if educationLevel changed
            if (updates.educationLevel) {
                const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [updates.educationLevel, enrollmentNo]);
                await ctx.stub.putState(educationLevelKey, Buffer.from(enrollmentNo));
            }
            // Update unique composite index on change
            if (hadUnique) {
                const oldUniqueKey = ctx.stub.createCompositeKey('academic~unique', beforeUniqueParts.map(v => `${v}`));
                await ctx.stub.deleteState(oldUniqueKey);
            }
            if (hasUnique) {
                const newUniqueKey = ctx.stub.createCompositeKey('academic~unique', afterUniqueParts.map(v => `${v}`));
                await ctx.stub.putState(newUniqueKey, Buffer.from(enrollmentNo));
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
            // Delete unique composite index if present
            const uniqueParts = [
                record.enrollmentNo,
                record.cycle,
                record.examMonth,
                record.examYear,
                record.examType,
                record.resultHash
            ];
            const hasAllUniqueParts = uniqueParts.every(v => v !== undefined && v !== null && `${v}`.trim() !== '');
            if (hasAllUniqueParts) {
                const uniqueKey = ctx.stub.createCompositeKey('academic~unique', uniqueParts.map(v => `${v}`));
                await ctx.stub.deleteState(uniqueKey);
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
                    const record = await this.GetAcademicRecordById(ctx, result.value.value.toString());
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
                    if (record.enrollmentNo) {
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
    async GetAcademicRecordHistory(ctx, enrollmentNo) {
        try {
            const iterator = await ctx.stub.getHistoryForKey(enrollmentNo);
            const history = [];

            while (true) {
                const result = await iterator.next();
                if (result.value) {
                    const ts = result.value.timestamp || {};
                    let seconds = ts.seconds;
                    const nanos = ts.nanos || 0;
                    if (seconds && typeof seconds === 'object') {
                        // Handle Long-like object { low, high, unsigned }
                        seconds = seconds.low !== undefined ? seconds.low : Number(seconds);
                    }
                    seconds = Number(seconds || 0);
                    const millis = (seconds * 1000) + Math.floor(nanos / 1e6);
                    const isoTime = new Date(millis).toISOString();

                    const record = {
                        txId: result.value.txId,
                        timestamp: isoTime,
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

    /**
     * Get academic record by unique fields
     * Fields: enrollmentNo, cycle, examMonth, examYear, examType, resultHash
     */
    async GetAcademicRecordByUniqueFields(ctx, enrollmentNo, cycle, examMonth, examYear, examType, resultHash) {
        try {
            // Only require the 4 fields that are actually stored in the composite key
            if (!enrollmentNo || !cycle || !examMonth || !examYear) {
                throw new Error('enrollmentNo, cycle, examMonth, and examYear are required');
            }
            
            // Create the composite key using only the 4 fields that are stored
            const semesterKey = ctx.stub.createCompositeKey('academic~student~semester', [
                `${enrollmentNo}`,
                `${cycle}`,
                `${examMonth}`,
                `${examYear}`
            ]);
            
            const semBytes = await ctx.stub.getState(semesterKey);
            if (semBytes && semBytes.length > 0) {
                const record = JSON.parse(semBytes.toString());
                
                // Additional validation: if examType and resultHash are provided, verify they match
                if (examType && resultHash) {
                    if (record.examType === examType && record.resultHash === resultHash) {
                        return record;
                    } else {
                        console.log('Record found but examType or resultHash mismatch');
                        console.log('Expected examType:', examType, 'Found:', record.examType);
                        console.log('Expected resultHash:', resultHash, 'Found:', record.resultHash);
                        return null;
                    }
                }
                
                return record;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting academic record by unique fields:', error);
            throw new Error(`Failed to get academic record by unique fields: ${error.message}`);
        }
    }
}

module.exports = AcademicRecordsContract; 
