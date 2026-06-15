'use strict';

const { Contract } = require('fabric-contract-api');

class SimpleStudentContract extends Contract {

    constructor() {
        super('SimpleStudentContract');
    }

    async InitLedger(ctx) {
        console.log('Initializing Simple Student Ledger');
        return 'Success';
    }

    async RegisterStudent(ctx, enrollmentNo, studentData) {
        try {
            const student = JSON.parse(studentData);
            student.enrollmentNo = enrollmentNo;
            student.createdAt = new Date().toISOString();
            
            await ctx.stub.putState(enrollmentNo, Buffer.from(JSON.stringify(student)));
            console.log(`Student ${enrollmentNo} registered successfully`);
            
            return JSON.stringify({
                success: true,
                message: 'Student registered successfully',
                enrollmentNo: enrollmentNo
            });
        } catch (error) {
            console.error('Error registering student:', error);
            throw new Error(`Failed to register student: ${error.message}`);
        }
    }

    async GetStudent(ctx, enrollmentNo) {
        try {
            const studentBytes = await ctx.stub.getState(enrollmentNo);
            if (!studentBytes || studentBytes.length === 0) {
                return null;
            }
            return studentBytes.toString();
        } catch (error) {
            console.error('Error getting student:', error);
            throw new Error(`Failed to get student: ${error.message}`);
        }
    }

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
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }

            return JSON.stringify(allResults);
        } catch (error) {
            console.error('Error getting all students:', error);
            throw new Error(`Failed to get all students: ${error.message}`);
        }
    }
}

module.exports = SimpleStudentContract; 