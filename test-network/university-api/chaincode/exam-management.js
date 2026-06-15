'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Exam Management Smart Contract
 * 
 * This contract provides comprehensive exam management functionality including:
 * - CRUD operations for exams
 * - Flexible field management
 * - Search and query capabilities
 * - Statistics and reporting
 * - Data validation and export
 * - Audit trail and history tracking
 */
class ExamManagementContract extends Contract {

    constructor() {
        super('ExamManagementContract');
    }

    /**
     * Initialize the ledger with sample exam data
     * @param {Context} ctx - The transaction context
     * @returns {string} JSON string with initialization results
     */
    async InitLedger(ctx) {
        console.log('🔄 Initializing Exam Management Ledger');
        
        const sampleExams = [
            {
                examId: 'EXAM2024001',
                examName: 'Computer Science Fundamentals',
                courseCode: 'CS101',
                semester: 1,
                academicYear: '2024-2025',
                examDate: '2024-12-15',
                duration: 180, // minutes
                totalMarks: 100,
                passingMarks: 40,
                examType: 'Theory',
                examMode: 'Offline',
                venue: 'Room 101, Block A',
                maxStudents: 50,
                status: 'Scheduled',
                instructions: 'Bring calculator and ID card',
                customFields: {
                    proctorName: 'Dr. Smith',
                    backupVenue: 'Room 102, Block A',
                    specialRequirements: 'None'
                }
            },
            {
                examId: 'EXAM2024002',
                examName: 'Data Structures and Algorithms',
                courseCode: 'CS201',
                semester: 2,
                academicYear: '2024-2025',
                examDate: '2024-12-20',
                duration: 240, // minutes
                totalMarks: 150,
                passingMarks: 60,
                examType: 'Practical',
                examMode: 'Online',
                venue: 'Computer Lab 1',
                maxStudents: 30,
                status: 'Scheduled',
                instructions: 'Laptop required, no internet access',
                customFields: {
                    softwareRequired: 'Visual Studio Code',
                    proctorName: 'Prof. Johnson',
                    backupVenue: 'Computer Lab 2'
                }
            },
            {
                examId: 'EXAM2024003',
                examName: 'Database Management Systems',
                courseCode: 'CS301',
                semester: 3,
                academicYear: '2024-2025',
                examDate: '2024-12-25',
                duration: 200, // minutes
                totalMarks: 120,
                passingMarks: 50,
                examType: 'Theory',
                examMode: 'Offline',
                venue: 'Room 201, Block B',
                maxStudents: 40,
                status: 'Scheduled',
                instructions: 'Bring pen and paper, no electronic devices',
                customFields: {
                    proctorName: 'Dr. Brown',
                    backupVenue: 'Room 202, Block B',
                    specialRequirements: 'None'
                }
            }
        ];

        let createdCount = 0;
        let skippedCount = 0;
        
        for (const exam of sampleExams) {
            try {
                await this.CreateExam(ctx, JSON.stringify(exam));
                createdCount++;
                console.log(`✅ Exam ${exam.examId} created successfully`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    skippedCount++;
                    console.log(`⏭️ Exam ${exam.examId} already exists, skipping...`);
                } else {
                    console.error(`❌ Error creating exam ${exam.examId}:`, error.message);
                    throw error;
                }
            }
        }
        
        console.log(`🎉 Exam Management Ledger initialization completed: ${createdCount} created, ${skippedCount} skipped`);
        return JSON.stringify({
            success: true,
            message: 'Exam Management Ledger initialization completed',
            created: createdCount,
            skipped: skippedCount,
            total: createdCount + skippedCount
        });
    }

    /**
     * Create a new exam with flexible field design
     * @param {Context} ctx - The transaction context
     * @param {string} examData - JSON string containing exam data
     * @returns {string} JSON string with creation results
     */
    async CreateExam(ctx, examData) {
        try {
            const exam = JSON.parse(examData);
            
            // Validate required fields
            if (!exam.examId || !exam.examName || !exam.courseCode) {
                throw new Error('Exam ID, exam name, and course code are required');
            }

            // Check if exam already exists
            const existingExam = await this.GetExamById(ctx, exam.examId);
            if (existingExam) {
                throw new Error(`Exam with ID ${exam.examId} already exists`);
            }

            // Add metadata for flexible field tracking with deterministic timestamp
            const timestamp = ctx.stub.getTxTimestamp();
            const isoString = new Date(timestamp.seconds.low * 1000).toISOString();
            
            const examRecord = {
                ...exam,
                metadata: {
                    createdAt: isoString,
                    createdBy: ctx.clientIdentity.getID(),
                    version: '1.0',
                    fieldHistory: [],
                    customFields: exam.customFields || {},
                    lastModified: isoString,
                    lastModifiedBy: ctx.clientIdentity.getID(),
                    txId: ctx.stub.getTxID()
                },
                // Ensure core fields are at top level for easy access
                examId: exam.examId,
                examName: exam.examName,
                courseCode: exam.courseCode,
                // Add any additional fields dynamically
                ...Object.keys(exam).reduce((acc, key) => {
                    if (!['examId', 'examName', 'courseCode', 'metadata', 'customFields'].includes(key)) {
                        acc[key] = exam[key];
                    }
                    return acc;
                }, {})
            };

            // Store exam data
            await ctx.stub.putState(exam.examId, Buffer.from(JSON.stringify(examRecord)));
            
            // Create composite keys for querying
            const courseKey = ctx.stub.createCompositeKey('exam~course', [exam.courseCode || '', exam.examId]);
            await ctx.stub.putState(courseKey, Buffer.from(exam.examId));

            const semesterKey = ctx.stub.createCompositeKey('exam~semester', [String(exam.semester || 0), exam.examId]);
            await ctx.stub.putState(semesterKey, Buffer.from(exam.examId));

            const statusKey = ctx.stub.createCompositeKey('exam~status', [exam.status || 'Unknown', exam.examId]);
            await ctx.stub.putState(statusKey, Buffer.from(exam.examId));

            console.log(`✅ Exam ${exam.examId} created successfully`);
            return JSON.stringify({
                success: true,
                message: 'Exam created successfully',
                examId: exam.examId,
                metadata: examRecord.metadata
            });

        } catch (error) {
            console.error('❌ Error creating exam:', error);
            throw error;
        }
    }

    /**
     * Get exam by ID
     * @param {Context} ctx - The transaction context
     * @param {string} examId - The exam ID
     * @returns {Object|null} The exam object or null if not found
     */
    async GetExamById(ctx, examId) {
        try {
            if (!examId) {
                throw new Error('Exam ID is required');
            }

            const examBytes = await ctx.stub.getState(examId);
            if (!examBytes || examBytes.length === 0) {
                return null;
            }
            
            const exam = JSON.parse(examBytes.toString());
            console.log(`📖 Retrieved exam: ${examId}`);
            return exam;
        } catch (error) {
            console.error('❌ Error getting exam by ID:', error);
            throw error;
        }
    }

    /**
     * Update exam with flexible field support
     * @param {Context} ctx - The transaction context
     * @param {string} examId - The exam ID
     * @param {string} updateData - JSON string containing update data
     * @param {string} fieldChanges - JSON string containing field change metadata
     * @returns {string} JSON string with update results
     */
    async UpdateExam(ctx, examId, updateData, fieldChanges) {
        try {
            if (!examId) {
                throw new Error('Exam ID is required');
            }

            const exam = await this.GetExamById(ctx, examId);
            if (!exam) {
                throw new Error(`Exam with ID ${examId} not found`);
            }

            const changes = JSON.parse(fieldChanges);
            const updates = JSON.parse(updateData);

            // Store previous values for history
            const previousValues = {};
            Object.keys(updates).forEach(key => {
                if (exam[key] !== undefined) {
                    previousValues[key] = exam[key];
                }
            });

            // Update fields
            Object.keys(updates).forEach(key => {
                if (key !== 'metadata' && key !== 'examId') {
                    exam[key] = updates[key];
                }
            });

            // Update metadata with deterministic timestamp
            const timestamp = ctx.stub.getTxTimestamp();
            const isoString = new Date(timestamp.seconds.low * 1000).toISOString();
            
            exam.metadata.lastModified = isoString;
            exam.metadata.lastModifiedBy = ctx.clientIdentity.getID();
            exam.metadata.fieldHistory.push({
                timestamp: changes.timestamp,
                changedBy: changes.changedBy,
                changes: changes.changes,
                previousValues: previousValues,
                txId: ctx.stub.getTxID()
            });

            // Store updated exam
            await ctx.stub.putState(examId, Buffer.from(JSON.stringify(exam)));

            console.log(`✅ Exam ${examId} updated successfully`);
            return JSON.stringify({
                success: true,
                message: 'Exam updated successfully',
                examId: examId,
                changes: changes.changes,
                previousValues: previousValues
            });

        } catch (error) {
            console.error('❌ Error updating exam:', error);
            throw error;
        }
    }

    /**
     * Add custom field to exam
     * @param {Context} ctx - The transaction context
     * @param {string} examId - The exam ID
     * @param {string} customFieldData - JSON string containing custom field data
     * @returns {string} JSON string with results
     */
    async AddCustomField(ctx, examId, customFieldData) {
        try {
            if (!examId) {
                throw new Error('Exam ID is required');
            }

            const exam = await this.GetExamById(ctx, examId);
            if (!exam) {
                throw new Error(`Exam with ID ${examId} not found`);
            }

            const customField = JSON.parse(customFieldData);
            
            if (!customField.name || customField.value === undefined) {
                throw new Error('Field name and value are required');
            }

            // Add to custom fields
            exam.metadata.customFields[customField.name] = {
                value: customField.value,
                type: customField.type || 'string',
                addedAt: customField.addedAt,
                addedBy: customField.addedBy
            };

            // Update metadata with deterministic timestamp
            const timestamp = ctx.stub.getTxTimestamp();
            const isoString = new Date(timestamp.seconds.low * 1000).toISOString();
            
            exam.metadata.lastModified = isoString;
            exam.metadata.lastModifiedBy = ctx.clientIdentity.getID();
            exam.metadata.fieldHistory.push({
                timestamp: isoString,
                changedBy: ctx.clientIdentity.getID(),
                changes: [`Added custom field: ${customField.name}`],
                previousValues: {},
                txId: ctx.stub.getTxID()
            });

            // Store updated exam
            await ctx.stub.putState(examId, Buffer.from(JSON.stringify(exam)));

            console.log(`✅ Custom field ${customField.name} added to exam ${examId}`);
            return JSON.stringify({
                success: true,
                message: 'Custom field added successfully',
                examId: examId,
                fieldName: customField.name,
                fieldValue: customField.value
            });

        } catch (error) {
            console.error('❌ Error adding custom field:', error);
            throw error;
        }
    }

    /**
     * Get all exams
     * @param {Context} ctx - The transaction context
     * @returns {string} JSON string containing all exams
     */
    async GetAllExams(ctx) {
        try {
            const startKey = '';
            const endKey = '';
            const allResults = [];

            const iterator = await ctx.stub.getStateByRange(startKey, endKey);
            let result = await iterator.next();

            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                    // Only include records that are exams (have examId)
                    if (record.examId) {
                        allResults.push(record);
                    }
                } catch (err) {
                    console.log('Skipping non-JSON record:', strValue);
                }
                result = await iterator.next();
            }

            await iterator.close();
            console.log(`📊 Retrieved ${allResults.length} exams`);
            return JSON.stringify(allResults);

        } catch (error) {
            console.error('❌ Error getting all exams:', error);
            throw error;
        }
    }

    /**
     * Get exams by course code using composite keys
     * @param {Context} ctx - The transaction context
     * @param {string} courseCode - The course code
     * @returns {string} JSON string containing exams for the course
     */
    async GetExamsByCourse(ctx, courseCode) {
        try {
            if (!courseCode || courseCode.trim() === '') {
                throw new Error('Course code is required and cannot be empty');
            }

            // Validate course code format
            const trimmedCourseCode = courseCode.trim();
            if (trimmedCourseCode.length === 0) {
                throw new Error('Course code cannot be empty');
            }

            console.log(`🔍 Searching for exams with course code: ${trimmedCourseCode}`);
            
            // Try to use composite key first
            try {
                const iterator = await ctx.stub.getStateByPartialCompositeKey('exam~course', [trimmedCourseCode]);
                const results = [];

                while (true) {
                    const res = await iterator.next();
                    if (res.value && res.value.key) {
                        const examId = res.value.value.toString();
                        const exam = await this.GetExamById(ctx, examId);
                        if (exam) {
                            results.push(exam);
                        }
                    }
                    if (res.done) {
                        await iterator.close();
                        break;
                    }
                }

                console.log(`📚 Found ${results.length} exams for course ${trimmedCourseCode} using composite keys`);
                return JSON.stringify(results);
            } catch (compositeKeyError) {
                console.log(`⚠️ Composite key query failed, falling back to full scan: ${compositeKeyError.message}`);
                
                // Fallback: get all exams and filter by course code
                const allExams = JSON.parse(await this.GetAllExams(ctx));
                const results = allExams.filter(exam => exam.courseCode === trimmedCourseCode);
                
                console.log(`📚 Found ${results.length} exams for course ${trimmedCourseCode} using fallback method`);
                return JSON.stringify(results);
            }

        } catch (error) {
            console.error('❌ Error getting exams by course:', error);
            throw error;
        }
    }

    /**
     * Search exams with flexible criteria
     * @param {Context} ctx - The transaction context
     * @param {string} searchCriteria - JSON string containing search criteria
     * @returns {string} JSON string containing matching exams
     */
    async SearchExams(ctx, searchCriteria) {
        try {
            const criteria = JSON.parse(searchCriteria);
            const allExams = JSON.parse(await this.GetAllExams(ctx));
            const results = [];

            for (const exam of allExams) {
                let matches = true;

                // Search by exam name (case-insensitive)
                if (criteria.examName) {
                    if (!exam.examName.toLowerCase().includes(criteria.examName.toLowerCase())) {
                        matches = false;
                    }
                }

                // Search by course code
                if (criteria.courseCode) {
                    if (exam.courseCode !== criteria.courseCode) {
                        matches = false;
                    }
                }

                // Search by exam type
                if (criteria.examType) {
                    if (exam.examType !== criteria.examType) {
                        matches = false;
                    }
                }

                // Search by status
                if (criteria.status) {
                    if (exam.status !== criteria.status) {
                        matches = false;
                    }
                }

                // Search by semester
                if (criteria.semester) {
                    if (exam.semester !== parseInt(criteria.semester)) {
                        matches = false;
                    }
                }

                // Search by date range
                if (criteria.startDate && criteria.endDate) {
                    const examDate = new Date(exam.examDate);
                    const startDate = new Date(criteria.startDate);
                    const endDate = new Date(criteria.endDate);
                    if (examDate < startDate || examDate > endDate) {
                        matches = false;
                    }
                }

                // Search by duration range
                if (criteria.minDuration && criteria.maxDuration) {
                    if (exam.duration < parseInt(criteria.minDuration) || exam.duration > parseInt(criteria.maxDuration)) {
                        matches = false;
                    }
                }

                if (matches) {
                    results.push(exam);
                }
            }

            console.log(`🔍 Search returned ${results.length} results`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('❌ Error searching exams:', error);
            throw error;
        }
    }

    /**
     * Get exam statistics
     * @param {Context} ctx - The transaction context
     * @returns {string} JSON string containing exam statistics
     */
    async GetExamStatistics(ctx) {
        try {
            const allExams = JSON.parse(await this.GetAllExams(ctx));
            
            const stats = {
                totalExams: allExams.length,
                byCourse: {},
                byType: {},
                byStatus: {},
                bySemester: {},
                averageDuration: 0,
                averageMarks: 0,
                totalDuration: 0,
                totalMarks: 0
            };

            for (const exam of allExams) {
                // Count by course
                stats.byCourse[exam.courseCode] = (stats.byCourse[exam.courseCode] || 0) + 1;
                
                // Count by type
                stats.byType[exam.examType] = (stats.byType[exam.examType] || 0) + 1;
                
                // Count by status
                stats.byStatus[exam.status] = (stats.byStatus[exam.status] || 0) + 1;
                
                // Count by semester
                stats.bySemester[exam.semester] = (stats.bySemester[exam.semester] || 0) + 1;
                
                // Calculate totals
                stats.totalDuration += exam.duration || 0;
                stats.totalMarks += exam.totalMarks || 0;
            }

            // Calculate averages
            if (allExams.length > 0) {
                stats.averageDuration = Math.round(stats.totalDuration / allExams.length);
                stats.averageMarks = Math.round(stats.totalMarks / allExams.length);
            }

            console.log(`📊 Generated statistics for ${allExams.length} exams`);
            return JSON.stringify(stats);

        } catch (error) {
            console.error('❌ Error getting exam statistics:', error);
            throw error;
        }
    }

    /**
     * Get exam field history
     * @param {Context} ctx - The transaction context
     * @param {string} examId - The exam ID
     * @returns {string} JSON string containing exam history
     */
    async GetExamFieldHistory(ctx, examId) {
        try {
            if (!examId) {
                throw new Error('Exam ID is required');
            }

            const exam = await this.GetExamById(ctx, examId);
            if (!exam) {
                throw new Error(`Exam with ID ${examId} not found`);
            }

            const history = {
                examId: examId,
                examName: exam.examName,
                fieldHistory: exam.metadata.fieldHistory || [],
                totalChanges: exam.metadata.fieldHistory ? exam.metadata.fieldHistory.length : 0,
                createdAt: exam.metadata.createdAt,
                lastModified: exam.metadata.lastModified
            };

            console.log(`📜 Retrieved history for exam ${examId}`);
            return JSON.stringify(history);

        } catch (error) {
            console.error('❌ Error getting exam history:', error);
            throw error;
        }
    }

    /**
     * Delete exam
     * @param {Context} ctx - The transaction context
     * @param {string} examId - The exam ID
     * @returns {string} JSON string with deletion results
     */
    async DeleteExam(ctx, examId) {
        try {
            if (!examId) {
                throw new Error('Exam ID is required');
            }

            const exam = await this.GetExamById(ctx, examId);
            if (!exam) {
                throw new Error(`Exam with ID ${examId} not found`);
            }

            // Delete the main exam record
            await ctx.stub.deleteState(examId);

            // Delete composite keys
            const courseKey = ctx.stub.createCompositeKey('exam~course', [exam.courseCode || '', examId]);
            await ctx.stub.deleteState(courseKey);

            const semesterKey = ctx.stub.createCompositeKey('exam~semester', [String(exam.semester || 0), examId]);
            await ctx.stub.deleteState(semesterKey);

            const statusKey = ctx.stub.createCompositeKey('exam~status', [exam.status || 'Unknown', examId]);
            await ctx.stub.deleteState(statusKey);

            console.log(`🗑️ Exam ${examId} deleted successfully`);
            return JSON.stringify({
                success: true,
                message: 'Exam deleted successfully',
                examId: examId,
                deletedExam: exam
            });

        } catch (error) {
            console.error('❌ Error deleting exam:', error);
            throw error;
        }
    }

    /**
     * Bulk create exams
     * @param {Context} ctx - The transaction context
     * @param {string} examsData - JSON string containing array of exam data
     * @returns {string} JSON string with bulk creation results
     */
    async BulkCreateExams(ctx, examsData) {
        try {
            const exams = JSON.parse(examsData);
            
            if (!Array.isArray(exams)) {
                throw new Error('Exams data must be an array');
            }

            const results = {
                total: exams.length,
                created: 0,
                failed: 0,
                errors: []
            };

            for (const exam of exams) {
                try {
                    await this.CreateExam(ctx, JSON.stringify(exam));
                    results.created++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        examId: exam.examId,
                        error: error.message
                    });
                }
            }

            console.log(`📦 Bulk creation completed: ${results.created} created, ${results.failed} failed`);
            return JSON.stringify({
                success: true,
                message: 'Bulk creation completed',
                results: results
            });

        } catch (error) {
            console.error('❌ Error in bulk creation:', error);
            throw error;
        }
    }

    /**
     * Get custom fields schema
     * @param {Context} ctx - The transaction context
     * @returns {string} JSON string containing custom fields schema
     */
    async GetCustomFieldsSchema(ctx) {
        try {
            const allExams = JSON.parse(await this.GetAllExams(ctx));
            const schema = {
                customFields: {},
                fieldTypes: {},
                usage: {}
            };

            for (const exam of allExams) {
                if (exam.metadata && exam.metadata.customFields) {
                    for (const [fieldName, fieldData] of Object.entries(exam.metadata.customFields)) {
                        if (!schema.customFields[fieldName]) {
                            schema.customFields[fieldName] = {
                                type: fieldData.type || 'string',
                                usage: 0,
                                examples: []
                            };
                        }
                        schema.customFields[fieldName].usage++;
                        if (!schema.customFields[fieldName].examples.includes(fieldData.value)) {
                            schema.customFields[fieldName].examples.push(fieldData.value);
                        }
                    }
                }
            }

            console.log(`📋 Generated custom fields schema`);
            return JSON.stringify(schema);

        } catch (error) {
            console.error('❌ Error getting custom fields schema:', error);
            throw error;
        }
    }

    /**
     * Validate exam data
     * @param {Context} ctx - The transaction context
     * @param {string} examData - JSON string containing exam data to validate
     * @returns {string} JSON string containing validation results
     */
    async ValidateExamData(ctx, examData) {
        try {
            const exam = JSON.parse(examData);
            const validation = {
                isValid: true,
                errors: [],
                warnings: [],
                suggestions: []
            };

            // Required field validation
            if (!exam.examId) {
                validation.isValid = false;
                validation.errors.push('Exam ID is required');
            }

            if (!exam.examName) {
                validation.isValid = false;
                validation.errors.push('Exam name is required');
            }

            if (!exam.courseCode) {
                validation.isValid = false;
                validation.errors.push('Course code is required');
            }

            // Data type validation
            if (exam.duration && typeof exam.duration !== 'number') {
                validation.warnings.push('Duration should be a number');
            }

            if (exam.totalMarks && typeof exam.totalMarks !== 'number') {
                validation.warnings.push('Total marks should be a number');
            }

            if (exam.passingMarks && typeof exam.passingMarks !== 'number') {
                validation.warnings.push('Passing marks should be a number');
            }

            // Business logic validation
            if (exam.passingMarks && exam.totalMarks && exam.passingMarks > exam.totalMarks) {
                validation.isValid = false;
                validation.errors.push('Passing marks cannot be greater than total marks');
            }

            if (exam.duration && exam.duration <= 0) {
                validation.isValid = false;
                validation.errors.push('Duration must be greater than 0');
            }

            if (exam.maxStudents && exam.maxStudents <= 0) {
                validation.warnings.push('Maximum students should be greater than 0');
            }

            // Date validation
            if (exam.examDate) {
                const examDate = new Date(exam.examDate);
                if (isNaN(examDate.getTime())) {
                    validation.errors.push('Invalid exam date format');
                } else if (examDate < new Date()) {
                    validation.warnings.push('Exam date is in the past');
                }
            }

            // Suggestions
            if (!exam.instructions) {
                validation.suggestions.push('Consider adding exam instructions');
            }

            if (!exam.venue) {
                validation.suggestions.push('Consider adding exam venue');
            }

            console.log(`✅ Validation completed for exam data`);
            return JSON.stringify(validation);

        } catch (error) {
            console.error('❌ Error validating exam data:', error);
            throw error;
        }
    }

    /**
     * Export exam data in various formats
     * @param {Context} ctx - The transaction context
     * @param {string} format - Export format (json, csv, summary)
     * @param {string} filters - JSON string containing export filters
     * @returns {string} JSON string containing exported data
     */
    async ExportExamData(ctx, format, filters) {
        try {
            const filterCriteria = JSON.parse(filters || '{}');
            let exams = JSON.parse(await this.GetAllExams(ctx));

            // Apply filters if provided
            if (Object.keys(filterCriteria).length > 0) {
                const filteredExams = JSON.parse(await this.SearchExams(ctx, JSON.stringify(filterCriteria)));
                exams = filteredExams;
            }

            let exportData;

            switch (format.toLowerCase()) {
                case 'json':
                    exportData = {
                        format: 'json',
                        timestamp: new Date().toISOString(),
                        count: exams.length,
                        data: exams
                    };
                    break;

                case 'csv':
                    // Convert to CSV format
                    const csvHeaders = ['examId', 'examName', 'courseCode', 'semester', 'examDate', 'duration', 'totalMarks', 'status'];
                    const csvData = exams.map(exam => 
                        csvHeaders.map(header => exam[header] || '').join(',')
                    );
                    exportData = {
                        format: 'csv',
                        timestamp: new Date().toISOString(),
                        count: exams.length,
                        headers: csvHeaders.join(','),
                        data: csvData.join('\n')
                    };
                    break;

                case 'summary':
                    const summary = {
                        totalExams: exams.length,
                        byCourse: {},
                        byType: {},
                        byStatus: {},
                        averageDuration: 0,
                        averageMarks: 0
                    };

                    let totalDuration = 0;
                    let totalMarks = 0;

                    for (const exam of exams) {
                        summary.byCourse[exam.courseCode] = (summary.byCourse[exam.courseCode] || 0) + 1;
                        summary.byType[exam.examType] = (summary.byType[exam.examType] || 0) + 1;
                        summary.byStatus[exam.status] = (summary.byStatus[exam.status] || 0) + 1;
                        totalDuration += exam.duration || 0;
                        totalMarks += exam.totalMarks || 0;
                    }

                    if (exams.length > 0) {
                        summary.averageDuration = Math.round(totalDuration / exams.length);
                        summary.averageMarks = Math.round(totalMarks / exams.length);
                    }

                    exportData = {
                        format: 'summary',
                        timestamp: new Date().toISOString(),
                        count: exams.length,
                        data: summary
                    };
                    break;

                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }

            console.log(`📤 Exported ${exams.length} exams in ${format} format`);
            return JSON.stringify(exportData);

        } catch (error) {
            console.error('❌ Error exporting exam data:', error);
            throw error;
        }
    }
}

module.exports = ExamManagementContract; 