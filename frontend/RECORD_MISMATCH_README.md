# Record Mismatch Screen

This document describes the new "Record Mismatch" screen that provides intelligent handling when QR code parameters match but the resultHash has changed.

## Overview

When a student's marksheet QR code contains outdated information (due to university updates), the system now intelligently detects this scenario and shows a "Record Mismatch" screen instead of the generic "No Records Found" screen.

## Problem Scenario

1. **Student has old marksheet** with QR code containing parameters:
   - enrollmentNo: "12345"
   - cycle: "1st"
   - examMonth: "December"
   - examYear: "2023"
   - examType: "Regular"
   - resultHash: "old_hash_123"

2. **University updates marks** and generates new record with:
   - Same parameters (enrollmentNo, cycle, examMonth, examYear, examType)
   - Different resultHash: "new_hash_456"

3. **Student scans old QR code** → System detects parameter match but hash mismatch → Shows "Record Mismatch" screen

## Solution Benefits

✅ **Intelligent Detection**: Distinguishes between "no record" vs "record updated"  
✅ **Better User Experience**: Clear explanation of what happened  
✅ **Actionable Information**: Users know exactly what to do  
✅ **Professional Appearance**: Maintains HPU branding standards  
✅ **Reduces Confusion**: No more misleading "No Records Found" for updated records  

## Implementation Details

### New Files Created
- `record-mismatch.html` - The Record Mismatch screen
- `RECORD_MISMATCH_README.md` - This documentation

### Modified Files
- `result.html` - Updated with smart record detection logic

### Smart Detection Logic

```javascript
// 1. Check for partial match (excluding resultHash)
const partialMatch = findRecordByParameters({
  enrollmentNo, cycle, examMonth, examYear, examType
});

// 2. If partial match found, compare resultHash
if (partialMatch && resultHash) {
  const currentHash = getCurrentHash(partialMatch);
  if (currentHash !== resultHash) {
    // RECORD MISMATCH DETECTED!
    showRecordMismatchScreen();
  }
}

// 3. If no partial match, continue with normal flow
```

## Screen Features

### Visual Design
- **Warning Icon**: ⚠️ in amber circle to indicate attention needed
- **Clear Title**: "Record Mismatched"
- **Explanatory Message**: Details about what happened
- **Action Required**: "Get your marksheet updated at university or Collect your updated marksheet from university"
- **QR Information**: Shows scanned parameters for transparency

### Styling
- Same HPU logo watermark as other screens
- Amber/warning color scheme for mismatch indication
- Professional layout consistent with HPU branding
- Clear call-to-action for next steps

## User Flow

1. **QR Scan** → `result.html`
2. **Smart Detection** → System checks all parameters
3. **Decision Point**:
   - **Exact Match** → Show result with data
   - **Parameter Match + Hash Mismatch** → Show "Record Mismatch" screen
   - **No Match** → Show "No Records Found" screen

## Technical Implementation

### Parameter Matching
The system checks these parameters for partial matching:
- `enrollmentNo` (required)
- `cycle` (optional)
- `examMonth` (optional)
- `examYear` (optional)
- `examType` (optional)

### Hash Comparison
Multiple hash fields are checked for comparison:
- `resultHash`
- `hash`
- `result_hash`
- `blockchainHash`
- `txHash`
- `recordHash`
- `id`
- `recordId`

### Early Exit
When mismatch is detected, the system immediately redirects to `record-mismatch.html` and exits the current flow to prevent unnecessary API calls.

## Future Enhancements

Potential improvements could include:
- **Contact Information**: Direct contact details for university
- **Status Tracking**: Check if updated marksheet is ready
- **Notification System**: Email/SMS when updated record is available
- **Portal Integration**: Link to student portal for updates
- **History View**: Show what changed between old and new records

## Testing Scenarios

1. **Exact Match**: All parameters + hash match → Show result
2. **Hash Mismatch**: Parameters match, hash differs → Show mismatch screen
3. **No Match**: No parameters match → Show no records found
4. **Partial Parameters**: Only some parameters provided → Handle gracefully

## Error Handling

- **API Failures**: Fallback to no-records-found screen
- **Parameter Parsing**: Graceful handling of malformed parameters
- **Hash Comparison**: Safe comparison with null/undefined values
- **Redirect Failures**: Fallback to current page with error logging 