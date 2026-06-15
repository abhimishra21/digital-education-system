'use strict';

const { Contract } = require('fabric-contract-api');

class StudentAdmissionContract extends Contract {

    constructor() {
        super('StudentAdmissionContract');
    }

    /**
     * Initialize the ledger with some sample data
     */
    async InitLedger(ctx) {
        console.log('Initializing Student Admission Ledger');
        
        const students = [
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
                gpa: 0.0,
                documents: ['Aadhar Card', '10th Certificate', '12th Certificate']
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
                gpa: 0.0,
                documents: ['Aadhar Card', '10th Certificate', '12th Certificate']
            }
        ];

        for (const student of students) {
            await this.RegisterStudent(ctx, JSON.stringify(student));
        }
        
        console.log('Student Admission Ledger initialized successfully');
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
            student.id = student.enrollmentNo;
            student.createdAt = new Date().toISOString();
            student.updatedAt = new Date().toISOString();
            student.createdBy = ctx.clientIdentity.getID();

            // Store student data
            await ctx.stub.putState(student.enrollmentNo, Buffer.from(JSON.stringify(student)));
            
            // Create composite key for querying
            const courseKey = ctx.stub.createCompositeKey('student~course', [student.course, student.enrollmentNo]);
            await ctx.stub.putState(courseKey, Buffer.from(student.enrollmentNo));

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
     * Update student information
     */
    async UpdateStudent(ctx, enrollmentNo, updateData) {
        try {
            const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!student) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            const updates = JSON.parse(updateData);
            
            // Update allowed fields
            const allowedFields = [
                'firstName', 'lastName', 'phoneNo', 'email', 'address', 
                'course', 'semester', 'gpa', 'documents', 'status'
            ];

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    student[field] = updates[field];
                }
            }

            // Update metadata
            student.updatedAt = new Date().toISOString();
            student.updatedBy = ctx.clientIdentity.getID();

            // Store updated student data
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(student)));

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
     * Delete student record
     */
    async DeleteStudent(ctx, enrollmentNo) {
        try {
            const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!student) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            // Delete the student record
            await ctx.stub.deleteState(enrollmentNo);

            // Delete composite key
            const courseKey = ctx.stub.createCompositeKey('student~course', [student.course, enrollmentNo]);
            await ctx.stub.deleteState(courseKey);

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
            const allResults = [];

            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log('Error parsing record:', err);
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }

            console.log(`Retrieved ${allResults.length} students`);
            return JSON.stringify(allResults);

        } catch (error) {
            console.error('Error getting all students:', error);
            throw new Error(`Failed to get all students: ${error.message}`);
        }
    }

    /**
     * Get students by course
     */
    async GetStudentsByCourse(ctx, course) {
        try {
            const courseResults = [];
            const courseKey = ctx.stub.createCompositeKey('student~course', [course, '']);
            
            for await (const {key, value} of ctx.stub.getStateByPartialCompositeKey('student~course', [course])) {
                const enrollmentNo = ctx.stub.splitCompositeKey(key).attributes[1];
                const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
                if (student) {
                    courseResults.push(student);
                }
            }

            console.log(`Retrieved ${courseResults.length} students for course: ${course}`);
            return JSON.stringify(courseResults);

        } catch (error) {
            console.error('Error getting students by course:', error);
            throw new Error(`Failed to get students by course: ${error.message}`);
        }
    }

    /**
     * Search students by name
     */
    async SearchStudentsByName(ctx, searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                throw new Error('Search term cannot be empty');
            }

            console.log(`Searching for students with term: "${searchTerm}"`);
            
            // Get all students first, then filter
            const allStudentsResult = await this.GetAllStudents(ctx);
            const allStudents = JSON.parse(allStudentsResult);
            
            const searchLower = searchTerm.toLowerCase().trim();
            const searchResults = [];

            // Filter students based on search term
            for (const student of allStudents) {
                if (!student.Record) continue;
                
                const record = student.Record;
                const firstName = (record.firstName || '').toLowerCase();
                const lastName = (record.lastName || '').toLowerCase();
                const fullName = `${firstName} ${lastName}`.trim();
                const enrollmentNo = (record.enrollmentNo || '').toLowerCase();
                const email = (record.email || '').toLowerCase();

                // Search in multiple fields
                if (firstName.includes(searchLower) || 
                    lastName.includes(searchLower) || 
                    fullName.includes(searchLower) ||
                    enrollmentNo.includes(searchLower) ||
                    email.includes(searchLower)) {
                    searchResults.push(student);
                }
            }

            console.log(`Found ${searchResults.length} students matching "${searchTerm}"`);
            return JSON.stringify(searchResults);

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
            const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!student) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            if (gpa < 0 || gpa > 4) {
                throw new Error('GPA must be between 0 and 4');
            }

            student.gpa = parseFloat(gpa);
            student.updatedAt = new Date().toISOString();
            student.updatedBy = ctx.clientIdentity.getID();

            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(student)));

            console.log(`GPA updated for student ${enrollmentNo}: ${gpa}`);
            return JSON.stringify({
                success: true,
                message: 'GPA updated successfully',
                enrollmentNo: enrollmentNo,
                gpa: gpa
            });

        } catch (error) {
            console.error('Error updating GPA:', error);
            throw new Error(`Failed to update GPA: ${error.message}`);
        }
    }

    /**
     * Get student statistics
     */
    async GetStudentStatistics(ctx) {
        try {
            const allStudents = JSON.parse(await this.GetAllStudents(ctx));
            
            const stats = {
                totalStudents: allStudents.length,
                activeStudents: allStudents.filter(s => s.Record.status === 'Active').length,
                courses: {},
                averageGPA: 0,
                totalGPA: 0,
                studentsWithGPA: 0
            };

            allStudents.forEach(student => {
                const course = student.Record.course;
                if (!stats.courses[course]) {
                    stats.courses[course] = 0;
                }
                stats.courses[course]++;

                if (student.Record.gpa > 0) {
                    stats.totalGPA += student.Record.gpa;
                    stats.studentsWithGPA++;
                }
            });

            if (stats.studentsWithGPA > 0) {
                stats.averageGPA = (stats.totalGPA / stats.studentsWithGPA).toFixed(2);
            }

            console.log('Student statistics retrieved successfully');
            return JSON.stringify(stats);

        } catch (error) {
            console.error('Error getting statistics:', error);
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }

    /**
     * Transfer student to different course
     */
    async TransferStudent(ctx, enrollmentNo, newCourse) {
        try {
            const student = await this.GetStudentByEnrollment(ctx, enrollmentNo);
            if (!student) {
                throw new Error(`Student with enrollment number ${enrollmentNo} not found`);
            }

            const oldCourse = student.course;
            
            // Delete old composite key
            const oldCourseKey = ctx.stub.createCompositeKey('student~course', [oldCourse, enrollmentNo]);
            await ctx.stub.deleteState(oldCourseKey);

            // Update course
            student.course = newCourse;
            student.updatedAt = new Date().toISOString();
            student.updatedBy = ctx.clientIdentity.getID();

            // Create new composite key
            const newCourseKey = ctx.stub.createCompositeKey('student~course', [newCourse, enrollmentNo]);
            await ctx.stub.putState(newCourseKey, Buffer.from(enrollmentNo));

            // Update student record
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(student)));

            console.log(`Student ${enrollmentNo} transferred from ${oldCourse} to ${newCourse}`);
            return JSON.stringify({
                success: true,
                message: 'Student transferred successfully',
                enrollmentNo: enrollmentNo,
                oldCourse: oldCourse,
                newCourse: newCourse
            });

        } catch (error) {
            console.error('Error transferring student:', error);
            throw new Error(`Failed to transfer student: ${error.message}`);
        }
    }
}

module.exports = StudentAdmissionContract; 