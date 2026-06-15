'use strict';

const { Contract } = require('fabric-contract-api');

class AcademicRecordsContract extends Contract {

    constructor() {
        super('AcademicRecordsContract');
    }

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

    async CreateAcademicRecord(ctx, recordData) {
        try {
            const record = JSON.parse(recordData);
            
            if (!record.recordId || !record.enrollmentNo || !record.educationLevel) {
                throw new Error('Record ID, enrollment number, and education level are required');
            }

            const existingRecord = await this.GetAcademicRecordById(ctx, record.recordId);
            if (existingRecord) {
                throw new Error(`Academic record with ID ${record.recordId} already exists`);
            }

            record.createdAt = new Date().toISOString();
            record.updatedAt = new Date().toISOString();
            record.createdBy = ctx.clientIdentity.getID();

            await ctx.stub.putState(record.recordId, Buffer.from(JSON.stringify(record)));
            
            const enrollmentKey = ctx.stub.createCompositeKey('academic~enrollment', [record.enrollmentNo, record.recordId]);
            await ctx.stub.putState(enrollmentKey, Buffer.from(record.recordId));

            const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [record.educationLevel, record.recordId]);
            await ctx.stub.putState(educationLevelKey, Buffer.from(record.recordId));

            console.log(`Academic record ${record.recordId} created successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record created successfully',
                recordId: record.recordId
            });

        } catch (error) {
            console.error('Error creating academic record:', error);
            throw new Error(`Failed to create academic record: ${error.message}`);
        }
    }

    async GetAcademicRecordById(ctx, recordId) {
        try {
            const recordBytes = await ctx.stub.getState(recordId);
            if (!recordBytes || recordBytes.length === 0) {
                return null;
            }
            return JSON.parse(recordBytes.toString());
        } catch (error) {
            console.error('Error getting academic record:', error);
            throw new Error(`Failed to get academic record: ${error.message}`);
        }
    }

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

    async UpdateAcademicRecord(ctx, recordId, updateData) {
        try {
            const record = await this.GetAcademicRecordById(ctx, recordId);
            if (!record) {
                throw new Error(`Academic record with ID ${recordId} not found`);
            }

            const updates = JSON.parse(updateData);
            
            const allowedFields = [
                'educationLevel', 'schoolOrCollegeName', 'boardOrUniversityName',
                'institutionAddress', 'institutionCode', 'startYear', 'endYear',
                'passingYear', 'stream', 'majorSubjects', 'optionalSubjects',
                'percentage', 'grade'
            ];

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    record[field] = updates[field];
                }
            }

            record.updatedAt = new Date().toISOString();
            record.updatedBy = ctx.clientIdentity.getID();

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(record)));

            console.log(`Academic record ${recordId} updated successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record updated successfully',
                recordId: recordId
            });

        } catch (error) {
            console.error('Error updating academic record:', error);
            throw new Error(`Failed to update academic record: ${error.message}`);
        }
    }

    async DeleteAcademicRecord(ctx, recordId) {
        try {
            const record = await this.GetAcademicRecordById(ctx, recordId);
            if (!record) {
                throw new Error(`Academic record with ID ${recordId} not found`);
            }

            await ctx.stub.deleteState(recordId);

            const enrollmentKey = ctx.stub.createCompositeKey('academic~enrollment', [record.enrollmentNo, recordId]);
            await ctx.stub.deleteState(enrollmentKey);

            const educationLevelKey = ctx.stub.createCompositeKey('academic~level', [record.educationLevel, recordId]);
            await ctx.stub.deleteState(educationLevelKey);

            console.log(`Academic record ${recordId} deleted successfully`);
            return JSON.stringify({
                success: true,
                message: 'Academic record deleted successfully',
                recordId: recordId
            });

        } catch (error) {
            console.error('Error deleting academic record:', error);
            throw new Error(`Failed to delete academic record: ${error.message}`);
        }
    }

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
                    if (record.recordId && record.recordId.startsWith('AR')) {
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
}

module.exports = AcademicRecordsContract;

// Start chaincode
const shim = require('fabric-shim');

if (require.main === module) {
    shim.start(new AcademicRecordsContract())
        .then(() => console.log('AcademicRecordsContract chaincode started'))
        .catch((err) => console.error('Error starting AcademicRecordsContract chaincode:', err));
}
