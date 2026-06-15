/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

// Import the academic records contract
const AcademicRecordsContract = require('./academic-records');

// Export the contract
module.exports.contracts = [AcademicRecordsContract]; 