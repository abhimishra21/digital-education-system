'use strict';

const { Contract } = require('fabric-contract-api');

class ComprehensiveStudentAdmissionContract extends Contract {

    // Static configuration for field management
    static FIELD_CONFIG = {
        INDEXABLE_FIELDS: [
            'enrollmentNo', 'firstName', 'lastName', 'course', 'status', 'semester', 
            'gpa', 'email', 'phoneNo', 'admissionDate', 'dateOfBirth'
        ],
        EXCLUDED_FIELDS: [
            'createdAt', 'updatedAt', 'documents', 'docType'
        ],
        RANGE_QUERY_FIELDS: [
            'gpa', 'semester', 'admissionDate', 'dateOfBirth'
        ],
        TEXT_SEARCH_FIELDS: [
            'firstName', 'lastName', 'email', 'course', 'status'
        ],
        COMPOSITE_KEY_PREFIXES: {
            'course': 'course~enrollmentNo',
            'status': 'status~enrollmentNo',
            'semester': 'semester~enrollmentNo',
            'gpa': 'gpa~enrollmentNo'
        }
    };

    constructor() {
        super('ComprehensiveStudentAdmissionContract');
    }

    /**
     * Detect new fields in student data that are not in the current configuration
     */
    async detectNewFields(ctx, studentData) {
        try {
            const existingFields = new Set([
                ...ComprehensiveStudentAdmissionContract.FIELD_CONFIG.INDEXABLE_FIELDS,
                ...ComprehensiveStudentAdmissionContract.FIELD_CONFIG.EXCLUDED_FIELDS
            ]);

            const newFields = [];
            for (const [fieldName, fieldValue] of Object.entries(studentData)) {
                if (!existingFields.has(fieldName) && fieldName !== 'enrollmentNo') {
                    newFields.push({
                        name: fieldName,
                        type: this.determineFieldType(fieldValue)
                    });
                }
            }

            if (newFields.length > 0) {
                console.log(`Detected ${newFields.length} new fields:`, newFields.map(f => f.name));
                await this.updateFieldConfiguration(ctx, newFields);
            }

            return newFields;
        } catch (error) {
            console.error('Error detecting new fields:', error);
            throw new Error(`Failed to detect new fields: ${error.message}`);
        }
    }

    /**
     * Determine the type of a field based on its value
     */
    determineFieldType(value) {
        if (typeof value === 'string') return 'text';
        if (typeof value === 'number') return 'numeric';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object' && value !== null) return 'object';
        return 'text';
    }

    /**
     * Update field configuration with newly detected fields
     */
    async updateFieldConfiguration(ctx, newFields) {
        try {
            const configKey = 'FIELD_CONFIG';
            let currentConfig = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;

            // Add new fields to indexable fields
            for (const field of newFields) {
                if (!currentConfig.INDEXABLE_FIELDS.includes(field.name)) {
                    currentConfig.INDEXABLE_FIELDS.push(field.name);
                }

                // Add to appropriate category based on type
                if (field.type === 'numeric' && !currentConfig.RANGE_QUERY_FIELDS.includes(field.name)) {
                    currentConfig.RANGE_QUERY_FIELDS.push(field.name);
                }
                if (field.type === 'text' && !currentConfig.TEXT_SEARCH_FIELDS.includes(field.name)) {
                    currentConfig.TEXT_SEARCH_FIELDS.push(field.name);
                }

                // Create composite key prefix for new field
                if (!currentConfig.COMPOSITE_KEY_PREFIXES[field.name]) {
                    currentConfig.COMPOSITE_KEY_PREFIXES[field.name] = `${field.name}~enrollmentNo`;
                }
            }

            // Store updated configuration
            await ctx.stub.putState(configKey, Buffer.from(JSON.stringify(currentConfig)));
            console.log('Field configuration updated with new fields');
        } catch (error) {
            console.error('Error updating field configuration:', error);
            throw new Error(`Failed to update field configuration: ${error.message}`);
        }
    }

    /**
     * Create composite key indexes for a student
     */
    async createCompositeKeyIndexes(ctx, student) {
        try {
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            
            for (const fieldName of config.INDEXABLE_FIELDS) {
                if (student[fieldName] !== undefined && student[fieldName] !== null) {
                    const prefix = config.COMPOSITE_KEY_PREFIXES[fieldName] || `${fieldName}~enrollmentNo`;
                    const compositeKey = ctx.stub.createCompositeKey(prefix, [student[fieldName], student.enrollmentNo]);
                    
                    // Store a dummy value to create the index
                    await ctx.stub.putState(compositeKey, Buffer.from('\u0000'));
                }
            }
        } catch (error) {
            console.error('Error creating composite key indexes:', error);
            // Don't throw error to avoid breaking the main operation
        }
    }

    /**
     * Update composite key indexes for a student
     */
    async updateCompositeKeyIndexes(ctx, student) {
        try {
            await this.createCompositeKeyIndexes(ctx, student);
        } catch (error) {
            console.error('Error updating composite key indexes:', error);
            // Don't throw error to avoid breaking the main operation
        }
    }

    /**
     * Remove composite key indexes for a student
     */
    async removeCompositeKeyIndexes(ctx, student) {
        try {
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            
            for (const fieldName of config.INDEXABLE_FIELDS) {
                if (student[fieldName] !== undefined && student[fieldName] !== null) {
                    const prefix = config.COMPOSITE_KEY_PREFIXES[fieldName] || `${fieldName}~enrollmentNo`;
                    const compositeKey = ctx.stub.createCompositeKey(prefix, [student[fieldName], student.enrollmentNo]);
                    
                    // Delete the index
                    await ctx.stub.deleteState(compositeKey);
                }
            }
        } catch (error) {
            console.error('Error removing composite key indexes:', error);
            // Don't throw error to avoid breaking the main operation
        }
    }

    /**
     * Initialize the ledger with sample data
     */
    async InitLedger(ctx) {
        console.log('Initializing Comprehensive Student Admission Ledger');
        
        // Use a consistent timestamp for all initialization
        const initTimestamp = '2024-06-01T00:00:00.000Z';
        
        const sampleStudents = [
            {
                enrollmentNo: 'EN2024001',
                firstName: 'Rahul',
                lastName: 'Kumar',
                fathersName: 'Rajesh Kumar',
                mothersName: 'Sunita Devi',
                dateOfBirth: '1998-05-15',
                phoneNo: '+91-9876543210',
                email: 'rahul.kumar@email.com',
                address: '123 Main Street, Delhi',
                course: 'Computer Science',
                admissionDate: '2024-06-01',
                status: 'Active',
                semester: 1,
                gpa: 3.8,
                documents: ['Aadhar Card', '10th Certificate', '12th Certificate'],
                docType: 'student', // Add docType for rich queries
                createdAt: initTimestamp,
                updatedAt: initTimestamp
            },
            {
                enrollmentNo: 'EN2024002',
                firstName: 'Priya',
                lastName: 'Sharma',
                fathersName: 'Amit Sharma',
                mothersName: 'Reena Sharma',
                dateOfBirth: '1999-08-22',
                phoneNo: '+91-8765432109',
                email: 'priya.sharma@email.com',
                address: '456 Park Avenue, Mumbai',
                course: 'Electrical Engineering',
                admissionDate: '2024-06-02',
                status: 'Active',
                semester: 1,
                gpa: 3.9,
                documents: ['Aadhar Card', '10th Certificate', '12th Certificate'],
                docType: 'student', // Add docType for rich queries
                createdAt: initTimestamp,
                updatedAt: initTimestamp
            }
        ];

        for (const student of sampleStudents) {
            await ctx.stub.putState(student.enrollmentNo, Buffer.from(JSON.stringify(student)));
            await this.createCompositeKeyIndexes(ctx, student);
            console.log(`Student ${student.enrollmentNo} initialized`);
        }

        console.log('Comprehensive Student Admission Ledger initialized successfully');
    }

    /**
     * Register a new student
     */
    async RegisterStudent(ctx, studentData) {
        try {
            const student = JSON.parse(studentData);
            
            // Validate required fields
            if (!student.enrollmentNo || !student.firstName || !student.lastName) {
                throw new Error('Enrollment number, first name, and last name are required');
            }

            // Check if student already exists
            const existingStudent = await this.GetStudentByEnrollment(ctx, student.enrollmentNo);
            if (existingStudent) {
                throw new Error(`Student with enrollment number ${student.enrollmentNo} already exists`);
            }

            // Add metadata
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            student.createdAt = timestamp;
            student.updatedAt = timestamp;
            student.docType = 'student'; // Add docType for rich queries

            // Detect and handle new fields
            await this.detectNewFields(ctx, student);

            // Store student data
            await ctx.stub.putState(student.enrollmentNo, Buffer.from(JSON.stringify(student)));

            // Create composite key indexes
            await this.createCompositeKeyIndexes(ctx, student);

            // Create history entry for student creation
            const changes = [{
                field: 'all',
                oldValue: null,
                newValue: JSON.stringify(student)
            }];
            await this.CreateHistoryEntries(ctx, student.enrollmentNo, 'created', changes);

            console.log(`Student ${student.enrollmentNo} registered successfully`);
            return JSON.stringify({
                success: true,
                message: 'Student registered successfully',
                enrollmentNo: student.enrollmentNo
            });

        } catch (error) {
            console.error('Error registering student:', error);
            throw new Error(`Failed to register student: ${error.message}`);
        }
    }

    /**
     * Get student by enrollment number
     */
    async GetStudentByEnrollment(ctx, enrollmentNo) {
        try {
            const studentBytes = await ctx.stub.getState(enrollmentNo);
            if (!studentBytes || studentBytes.length === 0) {
                return null;
            }
            return JSON.parse(studentBytes.toString());
        } catch (error) {
            console.error('Error getting student:', error);
            throw new Error(`Failed to get student: ${error.message}`);
        }
    }

    /**
     * Update existing student information
     */
    async UpdateStudent(ctx, enrollmentNo, updatedStudentData) {
        try {
            // Check if student exists
            const existingStudent = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!existingStudent) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            // Parse the updated student data
            const updatedStudent = JSON.parse(updatedStudentData);
            
            // Preserve the original enrollment number and creation date
            updatedStudent.enrollmentNo = enrollmentNo;
            updatedStudent.createdAt = existingStudent.createdAt;
            updatedStudent.updatedAt = new Date().toISOString().split('.')[0] + 'Z';
            updatedStudent.docType = 'student'; // Ensure docType is present

            // Detect and handle new fields
            await this.detectNewFields(ctx, updatedStudent);

            // Track changes between existing and updated student
            const changes = [];
            for (const [key, newValue] of Object.entries(updatedStudent)) {
                if (key !== 'enrollmentNo' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'docType') {
                    const oldValue = existingStudent[key];
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        changes.push({
                            field: key,
                            oldValue: oldValue,
                            newValue: newValue
                        });
                    }
                }
            }

            // Remove old composite key indexes
            await this.removeCompositeKeyIndexes(ctx, existingStudent);

            // Store updated student data
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(updatedStudent)));

            // Create new composite key indexes
            await this.updateCompositeKeyIndexes(ctx, updatedStudent);

            // Create history entries if there are changes
            if (changes.length > 0) {
                await this.CreateHistoryEntries(ctx, enrollmentNo, 'updated', changes);
            }

            console.log(`Student ${enrollmentNo} updated successfully`);
            return JSON.stringify({
                success: true,
                message: 'Student updated successfully',
                enrollmentNo: enrollmentNo
            });

        } catch (error) {
            console.error('Error updating student:', error);
            throw new Error(`Failed to update student: ${error.message}`);
        }
    }

    /**
     * Update specific student field (like GPA, course, etc.)
     */
    async UpdateStudentField(ctx, enrollmentNo, fieldName, fieldValue) {
        try {
            // Check if student exists
            const existingStudent = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!existingStudent) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            // Track the change
            const oldValue = existingStudent[fieldName];
            const newValue = fieldValue;

            // Update the field
            existingStudent[fieldName] = newValue;
            existingStudent.updatedAt = new Date().toISOString().split('.')[0] + 'Z';

            // Detect new fields if this is a new field
            if (oldValue === undefined) {
                await this.detectNewFields(ctx, existingStudent);
            }

            // Remove old composite key index if it exists
            if (oldValue !== undefined && oldValue !== null) {
                const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
                const prefix = config.COMPOSITE_KEY_PREFIXES[fieldName] || `${fieldName}~enrollmentNo`;
                const oldCompositeKey = ctx.stub.createCompositeKey(prefix, [oldValue, enrollmentNo]);
                await ctx.stub.deleteState(oldCompositeKey);
            }

            // Store updated student data
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(existingStudent)));

            // Create new composite key index
            if (newValue !== undefined && newValue !== null) {
                const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
                const prefix = config.COMPOSITE_KEY_PREFIXES[fieldName] || `${fieldName}~enrollmentNo`;
                const newCompositeKey = ctx.stub.createCompositeKey(prefix, [newValue, enrollmentNo]);
                await ctx.stub.putState(newCompositeKey, Buffer.from('\u0000'));
            }

            // Create history entry
            const changes = [{
                field: fieldName,
                oldValue: oldValue,
                newValue: newValue
            }];
            await this.CreateHistoryEntries(ctx, enrollmentNo, 'updated', changes);

            console.log(`Student ${enrollmentNo} field ${fieldName} updated successfully`);
            return JSON.stringify({
                success: true,
                message: `Student field ${fieldName} updated successfully`,
                enrollmentNo: enrollmentNo,
                field: fieldName,
                oldValue: oldValue,
                newValue: newValue
            });

        } catch (error) {
            console.error('Error updating student field:', error);
            throw new Error(`Failed to update student field: ${error.message}`);
        }
    }

    /**
     * Delete a student
     */
    async DeleteStudent(ctx, enrollmentNo) {
        try {
            // Check if student exists
            const existingStudent = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!existingStudent) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            // Remove composite key indexes
            await this.removeCompositeKeyIndexes(ctx, existingStudent);

            // Delete student data
            await ctx.stub.deleteState(enrollmentNo);

            // Create history entry for deletion
            const changes = [{
                field: 'all',
                oldValue: JSON.stringify(existingStudent),
                newValue: null
            }];
            await this.CreateHistoryEntries(ctx, enrollmentNo, 'deleted', changes);

            console.log(`Student ${enrollmentNo} deleted successfully`);
            return JSON.stringify({
                success: true,
                message: 'Student deleted successfully',
                enrollmentNo: enrollmentNo
            });

        } catch (error) {
            console.error('Error deleting student:', error);
            throw new Error(`Failed to delete student: ${error.message}`);
        }
    }

    /**
     * Get all students
     */
    async GetAllStudents(ctx) {
        try {
            const startKey = '';
            const endKey = '';
            const students = [];

            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                try {
                    const student = JSON.parse(strValue);
                    // Only include student records (not history records)
                    if (student.enrollmentNo && !key.startsWith('HISTORY_')) {
                        students.push({
                            Key: key,
                            Record: student
                        });
                    }
                } catch (err) {
                    console.log('Error parsing student record:', err);
                }
            }

            console.log(`Retrieved ${students.length} students`);
            return JSON.stringify(students);
        } catch (error) {
            console.error('Error getting all students:', error);
            throw new Error(`Failed to get all students: ${error.message}`);
        }
    }

    /**
     * Get students by course (enhanced with composite keys)
     */
    async GetStudentsByCourse(ctx, course) {
        try {
            const students = [];
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            const prefix = config.COMPOSITE_KEY_PREFIXES['course'] || 'course~enrollmentNo';

            // Use composite key for efficient querying
            const iterator = await ctx.stub.getStateByPartialCompositeKey(prefix, [course]);
            
            for await (const result of iterator) {
                const enrollmentNo = result.value.toString();
                const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                if (student) {
                    students.push({
                        Key: student.enrollmentNo,
                        Record: student
                    });
                }
            }

            console.log(`Retrieved ${students.length} students for course: ${course}`);
            return JSON.stringify(students);
        } catch (error) {
            console.error('Error getting students by course:', error);
            throw new Error(`Failed to get students by course: ${error.message}`);
        }
    }

    /**
     * Search students by name (enhanced with composite keys)
     */
    async SearchStudentsByName(ctx, searchTerm) {
        try {
            const students = [];
            const searchLower = searchTerm.toLowerCase();
            
            // Use composite keys for firstName and lastName
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            
            // Search by firstName
            const firstNamePrefix = config.COMPOSITE_KEY_PREFIXES['firstName'] || 'firstName~enrollmentNo';
            const firstNameIterator = await ctx.stub.getStateByPartialCompositeKey(firstNamePrefix, []);
            
            for await (const result of firstNameIterator) {
                const parts = result.key.split('\u0000');
                if (parts.length >= 2) {
                    const firstName = parts[1];
                    if (firstName.toLowerCase().includes(searchLower)) {
                        const enrollmentNo = parts[2];
                        const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                        if (student) {
                            students.push({
                                Key: student.enrollmentNo,
                                Record: student
                            });
                        }
                    }
                }
            }
            
            // Search by lastName
            const lastNamePrefix = config.COMPOSITE_KEY_PREFIXES['lastName'] || 'lastName~enrollmentNo';
            const lastNameIterator = await ctx.stub.getStateByPartialCompositeKey(lastNamePrefix, []);
            
            for await (const result of lastNameIterator) {
                const parts = result.key.split('\u0000');
                if (parts.length >= 2) {
                    const lastName = parts[1];
                    if (lastName.toLowerCase().includes(searchLower)) {
                        const enrollmentNo = parts[2];
                        const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                        if (student) {
                            // Avoid duplicates
                            const exists = students.find(s => s.Key === enrollmentNo);
                            if (!exists) {
                                students.push({
                                    Key: student.enrollmentNo,
                                    Record: student
                                });
                            }
                        }
                    }
                }
            }

            console.log(`Found ${students.length} students matching search term: ${searchTerm}`);
            return JSON.stringify(students);
        } catch (error) {
            console.error('Error searching students by name:', error);
            throw new Error(`Failed to search students by name: ${error.message}`);
        }
    }

    /**
     * Update student GPA
     */
    async UpdateStudentGPA(ctx, enrollmentNo, gpa) {
        try {
            const gpaValue = parseFloat(gpa);
            if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4.0) {
                throw new Error('GPA must be a number between 0 and 4.0');
            }
            
            return await this.UpdateStudentField(ctx, enrollmentNo, 'gpa', gpaValue);
        } catch (error) {
            console.error('Error updating student GPA:', error);
            throw new Error(`Failed to update student GPA: ${error.message}`);
        }
    }

    /**
     * Transfer student to different course
     */
    async TransferStudentCourse(ctx, enrollmentNo, newCourse) {
        try {
            if (!newCourse || newCourse.trim() === '') {
                throw new Error('New course is required');
            }
            
            return await this.UpdateStudentField(ctx, enrollmentNo, 'course', newCourse.trim());
        } catch (error) {
            console.error('Error transferring student course:', error);
            throw new Error(`Failed to transfer student course: ${error.message}`);
        }
    }

    /**
     * Get student statistics
     */
    async GetStudentStatistics(ctx) {
        try {
            const students = [];
            const startKey = '';
            const endKey = '';

            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                try {
                    const student = JSON.parse(strValue);
                    if (student.enrollmentNo && !key.startsWith('HISTORY_')) {
                        students.push(student);
                    }
                } catch (err) {
                    console.log('Error parsing student record:', err);
                }
            }

            const totalStudents = students.length;
            const activeStudents = students.filter(s => s.status === 'Active').length;
            
            const courses = {};
            students.forEach(student => {
                const course = student.course || 'undefined';
                courses[course] = (courses[course] || 0) + 1;
            });
            
            const studentsWithGPA = students.filter(s => s.gpa !== undefined && s.gpa !== null);
            const totalGPA = studentsWithGPA.reduce((sum, s) => sum + s.gpa, 0);
            const averageGPA = studentsWithGPA.length > 0 ? (totalGPA / studentsWithGPA.length).toFixed(2) : '0.00';
            
            const statistics = {
                totalStudents: totalStudents,
                activeStudents: activeStudents,
                courses: courses,
                averageGPA: averageGPA,
                totalGPA: totalGPA,
                studentsWithGPA: studentsWithGPA.length
            };
            
            console.log('Student statistics calculated successfully');
            return JSON.stringify(statistics);
        } catch (error) {
            console.error('Error getting student statistics:', error);
            throw new Error(`Failed to get student statistics: ${error.message}`);
        }
    }

    /**
     * Get students by status (enhanced with composite keys)
     */
    async GetStudentsByStatus(ctx, status) {
        try {
            const students = [];
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            const prefix = config.COMPOSITE_KEY_PREFIXES['status'] || 'status~enrollmentNo';

            // Use composite key for efficient querying
            const iterator = await ctx.stub.getStateByPartialCompositeKey(prefix, [status]);
            
            for await (const result of iterator) {
                const enrollmentNo = result.value.toString();
                const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                if (student) {
                    students.push({
                        Key: student.enrollmentNo,
                        Record: student
                    });
                }
            }

            console.log(`Retrieved ${students.length} students with status: ${status}`);
            return JSON.stringify(students);
        } catch (error) {
            console.error('Error getting students by status:', error);
            throw new Error(`Failed to get students by status: ${error.message}`);
        }
    }

    /**
     * Get students by semester (enhanced with composite keys)
     */
    async GetStudentsBySemester(ctx, semester) {
        try {
            const students = [];
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            const prefix = config.COMPOSITE_KEY_PREFIXES['semester'] || 'semester~enrollmentNo';
            
            // Use composite key for efficient querying
            const iterator = await ctx.stub.getStateByPartialCompositeKey(prefix, [parseInt(semester)]);
            
            for await (const result of iterator) {
                const enrollmentNo = result.value.toString();
                const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                if (student) {
                    students.push({
                        Key: student.enrollmentNo,
                        Record: student
                    });
                }
            }

            console.log(`Retrieved ${students.length} students in semester: ${semester}`);
            return JSON.stringify(students);
        } catch (error) {
            console.error('Error getting students by semester:', error);
            throw new Error(`Failed to get students by semester: ${error.message}`);
        }
    }

    /**
     * NEW: Query students using rich queries (CouchDB selectors)
     */
    async QueryStudentsByRichQuery(ctx, querySelector) {
        try {
            const query = JSON.parse(querySelector);
            const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            const results = [];
            
            for await (const result of iterator) {
                const student = JSON.parse(result.value.toString());
                results.push({
                    Key: result.key,
                    Record: student
                });
            }
            
            console.log(`Rich query returned ${results.length} results`);
            return JSON.stringify(results);
        } catch (error) {
            console.error('Error executing rich query:', error);
            throw new Error(`Failed to execute rich query: ${error.message}`);
        }
    }

    /**
     * NEW: Query by any indexed field
     */
    async QueryByField(ctx, fieldName, fieldValue) {
        try {
            const students = [];
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            const prefix = config.COMPOSITE_KEY_PREFIXES[fieldName] || `${fieldName}~enrollmentNo`;
            
            const iterator = await ctx.stub.getStateByPartialCompositeKey(prefix, [fieldValue]);
            
            for await (const result of iterator) {
                const enrollmentNo = result.value.toString();
                const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                if (student) {
                    students.push({
                        Key: student.enrollmentNo,
                        Record: student
                    });
                }
            }
            
            console.log(`Query by ${fieldName}=${fieldValue} returned ${students.length} results`);
            return JSON.stringify(students);
        } catch (error) {
            console.error('Error querying by field:', error);
            throw new Error(`Failed to query by field: ${error.message}`);
        }
    }

    /**
     * NEW: Get all indexed fields
     */
    async GetIndexedFields(ctx) {
        try {
            const config = ComprehensiveStudentAdmissionContract.FIELD_CONFIG;
            return JSON.stringify({
                indexableFields: config.INDEXABLE_FIELDS,
                rangeQueryFields: config.RANGE_QUERY_FIELDS,
                textSearchFields: config.TEXT_SEARCH_FIELDS,
                compositeKeyPrefixes: config.COMPOSITE_KEY_PREFIXES
            });
        } catch (error) {
            console.error('Error getting indexed fields:', error);
            throw new Error(`Failed to get indexed fields: ${error.message}`);
        }
    }

    /**
     * Create history entries for student changes
     */
    async CreateHistoryEntries(ctx, enrollmentNo, action, changes) {
        try {
            const txId = ctx.stub.getTxID();
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const userId = ctx.clientIdentity.getID();
            
            for (let i = 0; i < changes.length; i++) {
                const change = changes[i];
                const historyId = `HISTORY_${enrollmentNo}_${action}_${change.field}_${i}`;
                const historyData = {
                    id: historyId,
                    studentId: enrollmentNo,
                    action: action,
                    field: change.field,
                    oldValue: change.oldValue,
                    newValue: change.newValue,
                    changedBy: userId,
                    changedAt: timestamp,
                    description: `${change.field} updated from "${change.oldValue}" to "${change.newValue}"`
                };
                await ctx.stub.putState(historyId, Buffer.from(JSON.stringify(historyData)));
            }
            console.log(`Created ${changes.length} history entries for student ${enrollmentNo}`);
        } catch (error) {
            console.error('Error creating history entries:', error);
            throw new Error(`Failed to create history entries: ${error.message}`);
        }
    }

    /**
     * Get student history records
     */
    async GetStudentHistory(ctx, enrollmentNo) {
        try {
            const startKey = `HISTORY_${enrollmentNo}_`;
            const endKey = `HISTORY_${enrollmentNo}_\uffff`;
            const historyResults = [];
            
            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                try {
                    const historyRecord = JSON.parse(strValue);
                    historyResults.push(historyRecord);
                } catch (err) {
                    console.log('Error parsing history record:', err);
                }
            }
            
            historyResults.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
            console.log(`Retrieved ${historyResults.length} history records for student ${enrollmentNo}`);
            return JSON.stringify(historyResults);
        } catch (error) {
            console.error('Error getting student history:', error);
            throw new Error(`Failed to get student history: ${error.message}`);
        }
    }

    /**
     * Get complete student history with current data
     */
    async GetCompleteStudentHistory(ctx, enrollmentNo) {
        try {
            const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!student) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }
            
            const history = await this.GetStudentHistory(ctx, enrollmentNo);
            const historyRecords = JSON.parse(history);
            
            if (historyRecords.length === 0) {
                const creationHistory = {
                    id: `HISTORY_${enrollmentNo}_CREATED`,
                    studentId: enrollmentNo,
                    action: 'created',
                    field: 'all',
                    oldValue: null,
                    newValue: JSON.stringify(student),
                    changedBy: student.createdBy || 'System',
                    changedAt: student.createdAt || new Date().toISOString(),
                    description: 'Student record created'
                };
                historyRecords.push(creationHistory);
            }
            
            const response = {
                enrollmentNo: student.enrollmentNo,
                currentData: student,
                history: historyRecords,
                totalRecords: historyRecords.length
            };
            
            console.log(`Retrieved complete history for student ${enrollmentNo}`);
            return JSON.stringify(response);
        } catch (error) {
            console.error('Error getting complete student history:', error);
            throw new Error(`Failed to get complete student history: ${error.message}`);
        }
    }
}

module.exports = ComprehensiveStudentAdmissionContract; 