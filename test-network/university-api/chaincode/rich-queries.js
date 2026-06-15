'use strict';

const { Contract } = require('fabric-contract-api');

class RichQueryContract extends Contract {

    constructor() {
        super('RichQueryContract');
    }

    /**
     * Rich Query: Find students by course using CouchDB selector
     */
    async QueryStudentsByCourse(ctx, course) {
        try {
            const queryString = {
                selector: {
                    course: course
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students in course: ${course}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByCourse:', error);
            throw new Error(`Failed to query students by course: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by GPA range
     */
    async QueryStudentsByGPARange(ctx, minGPA, maxGPA) {
        try {
            const queryString = {
                selector: {
                    gpa: {
                        $gte: parseFloat(minGPA),
                        $lte: parseFloat(maxGPA)
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with GPA between ${minGPA} and ${maxGPA}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByGPARange:', error);
            throw new Error(`Failed to query students by GPA range: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by status and semester
     */
    async QueryStudentsByStatusAndSemester(ctx, status, semester) {
        try {
            const queryString = {
                selector: {
                    status: status,
                    semester: parseInt(semester)
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with status ${status} in semester ${semester}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByStatusAndSemester:', error);
            throw new Error(`Failed to query students by status and semester: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by name pattern (partial match)
     */
    async QueryStudentsByNamePattern(ctx, namePattern) {
        try {
            const queryString = {
                selector: {
                    $or: [
                        {
                            firstName: {
                                $regex: namePattern
                            }
                        },
                        {
                            lastName: {
                                $regex: namePattern
                            }
                        }
                    ]
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with name containing: ${namePattern}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByNamePattern:', error);
            throw new Error(`Failed to query students by name pattern: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by admission date range
     */
    async QueryStudentsByAdmissionDateRange(ctx, startDate, endDate) {
        try {
            const queryString = {
                selector: {
                    admissionDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students admitted between ${startDate} and ${endDate}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByAdmissionDateRange:', error);
            throw new Error(`Failed to query students by admission date range: ${error.message}`);
        }
    }

    /**
     * Rich Query: Complex query - High performing students in specific courses
     */
    async QueryHighPerformingStudents(ctx, minGPA, courses) {
        try {
            const courseArray = JSON.parse(courses);
            const queryString = {
                selector: {
                    gpa: {
                        $gte: parseFloat(minGPA)
                    },
                    course: {
                        $in: courseArray
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} high performing students (GPA >= ${minGPA}) in courses: ${courseArray.join(', ')}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryHighPerformingStudents:', error);
            throw new Error(`Failed to query high performing students: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by multiple criteria
     */
    async QueryStudentsByMultipleCriteria(ctx, criteria) {
        try {
            const searchCriteria = JSON.parse(criteria);
            const queryString = {
                selector: searchCriteria
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students matching criteria: ${JSON.stringify(searchCriteria)}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByMultipleCriteria:', error);
            throw new Error(`Failed to query students by multiple criteria: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students with pagination
     */
    async QueryStudentsWithPagination(ctx, pageSize, bookmark) {
        try {
            const queryString = {
                selector: {},
                limit: parseInt(pageSize)
            };

            if (bookmark && bookmark !== 'null') {
                queryString.bookmark = bookmark;
            }

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            // Get the bookmark for next page
            const responseMetadata = await iterator.getResponseMetadata();
            const nextBookmark = responseMetadata.bookmark;

            const response = {
                results: results,
                bookmark: nextBookmark,
                hasMore: nextBookmark !== undefined && nextBookmark !== null
            };

            console.log(`Retrieved ${results.length} students with pagination`);
            return JSON.stringify(response);

        } catch (error) {
            console.error('Error in QueryStudentsWithPagination:', error);
            throw new Error(`Failed to query students with pagination: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by email domain
     */
    async QueryStudentsByEmailDomain(ctx, domain) {
        try {
            const queryString = {
                selector: {
                    email: {
                        $regex: `@${domain}$`
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with email domain: ${domain}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByEmailDomain:', error);
            throw new Error(`Failed to query students by email domain: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by address pattern
     */
    async QueryStudentsByAddressPattern(ctx, addressPattern) {
        try {
            const queryString = {
                selector: {
                    address: {
                        $regex: addressPattern
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with address containing: ${addressPattern}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByAddressPattern:', error);
            throw new Error(`Failed to query students by address pattern: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by phone number pattern
     */
    async QueryStudentsByPhonePattern(ctx, phonePattern) {
        try {
            const queryString = {
                selector: {
                    phoneNo: {
                        $regex: phonePattern
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with phone number containing: ${phonePattern}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByPhonePattern:', error);
            throw new Error(`Failed to query students by phone pattern: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by father's or mother's name
     */
    async QueryStudentsByParentName(ctx, parentName) {
        try {
            const queryString = {
                selector: {
                    $or: [
                        {
                            fathersName: {
                                $regex: parentName
                            }
                        },
                        {
                            mothersName: {
                                $regex: parentName
                            }
                        }
                    ]
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with parent name containing: ${parentName}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByParentName:', error);
            throw new Error(`Failed to query students by parent name: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by date of birth range
     */
    async QueryStudentsByDateOfBirthRange(ctx, startDate, endDate) {
        try {
            const queryString = {
                selector: {
                    dateOfBirth: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students born between ${startDate} and ${endDate}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByDateOfBirthRange:', error);
            throw new Error(`Failed to query students by date of birth range: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by enrollment number pattern
     */
    async QueryStudentsByEnrollmentPattern(ctx, enrollmentPattern) {
        try {
            const queryString = {
                selector: {
                    enrollmentNo: {
                        $regex: enrollmentPattern
                    }
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with enrollment number containing: ${enrollmentPattern}`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByEnrollmentPattern:', error);
            throw new Error(`Failed to query students by enrollment pattern: ${error.message}`);
        }
    }

    /**
     * Rich Query: Find students by custom selector (advanced)
     */
    async QueryStudentsByCustomSelector(ctx, selectorJson) {
        try {
            const selector = JSON.parse(selectorJson);
            const queryString = {
                selector: selector
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const results = await this._getAllResults(iterator);

            console.log(`Found ${results.length} students with custom selector`);
            return JSON.stringify(results);

        } catch (error) {
            console.error('Error in QueryStudentsByCustomSelector:', error);
            throw new Error(`Failed to query students by custom selector: ${error.message}`);
        }
    }

    /**
     * Helper function to get all results from iterator
     */
    async _getAllResults(iterator) {
        const results = [];
        
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value) {
                const jsonRes = {};
                jsonRes.Key = res.value.key;
                jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                results.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        
        return results;
    }
}

module.exports = RichQueryContract; 