const API_BASE_URL = 'http://135.235.51.143:3001/api';
const ACADEMIC_API_BASE_URL = 'http://135.235.51.143:3002/api/academic';

import { Student, AcademicRecord } from '../types';

// BEGIN: Normalization utilities for Academic Records
const toNumberOrNull = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' && (val.trim() === '-' || val.trim() === '')) return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
};

const isAlreadySemesterResult = (rec: any): boolean => {
  return !!(rec && Array.isArray(rec?.marksDetails) && rec?.candidate && rec?.examination);
};

export const normalizeExternalSemesterResult = (rec: any): AcademicRecord => {
  // Debug: Log the incoming record
  console.log('Normalizing record:', rec);
  console.log('ResultHash in raw record:', rec?.resultHash);
  
  if (isAlreadySemesterResult(rec)) {
    return rec as AcademicRecord;
  }

  const papers: any[] = Array.isArray(rec?.papersJson) ? rec.papersJson : [];
  const examMonth = String(rec?.examMonth || '').trim();
  const examYear = String(rec?.examYear || '').trim();

  const marksDetails = papers.map((p, idx) => ({
    sNo: Number(p?.sNo ?? idx + 1),
    paperCode: String(p?.paperCode ?? ''),
    paperName: String(p?.paperName ?? ''),
    category: String(p?.papernature ?? ''),
    marksObtained: {
      TH: toNumberOrNull(p?.th),
      IA: toNumberOrNull(p?.ia),
      PR: toNumberOrNull(p?.pr),
      GR: toNumberOrNull(p?.gr),
      TOTAL: p?.totalmarkspaperwise ?? '',
    },
    minimumPassingMarks: Number(p?.totalpassingmarkspaperwise ?? 0),
    maximumMarks: Number(p?.totalmaxmarkspaperwise ?? 0),
  }));

  const recordIdBase = rec?.recordId || rec?.srNo || rec?.pk_sid || '';
  const examRoll = rec?.examRollNumber || rec?.rollno || '';

  const normalized: AcademicRecord = {
    id: 0,
    recordId: String(recordIdBase && examRoll ? `${recordIdBase}-${examRoll}` : (recordIdBase || examRoll || '')),
    serialNumber: String(rec?.srNo ?? ''),
    examRollNumber: String(examRoll ?? ''),
    resultHash: String(rec?.resultHash ?? rec?.hash ?? rec?.result_hash ?? rec?.blockchainHash ?? rec?.txHash ?? rec?.recordHash ?? ''), // Add resultHash field from API with fallbacks
    university: String(rec?.university ?? ''),
    naacAccreditation: String(rec?.naacAccreditation ?? ''),
    resultType: String(rec?.examType ?? rec?.resultType ?? ''),
    candidate: {
      name: String(rec?.cname ?? ''),
      fatherName: String(rec?.fname ?? ''),
      motherName: String(rec?.mname ?? ''),
      dateOfBirth: String(rec?.dob ?? ''),
      registrationNumber: String(rec?.univRegNO ?? ''),
    },
    examination: {
      name: String(rec?.degree ?? ''),
      semester: String(rec?.cycle ?? ''),
      examType: String(rec?.examType ?? ''),
      capacity: String(rec?.capacity ?? ''),
      collegeName: String(rec?.collegename ?? ''),
      examCenterName: String(rec?.centername ?? ''),
      examMonthYear: String([examMonth, examYear].filter(Boolean).join(' ') || ''),
    },
    marksDetails,
    resultSummary: {
      totalMarks: toNumberOrNull(rec?.totalmarks),
      result: String(rec?.resultStatus ?? ''),
    },
    resultDates: {
      resultDeclaration: String(rec?.resultDeclaration ?? ''),
      settlementDate: String(rec?.settlementDate ?? ''),
    },
    verification: {
      verifiedBy: String(rec?.createdBy ?? ''),
      controllerSignature: Boolean(rec?.controllerSignature ?? false),
    },
    downloadInfo: undefined,
    gradingLegend: undefined,
    createdBy: String(rec?.createdBy ?? ''),
    createdAt: String(rec?.createdAt ?? ''),
    updatedBy: String(rec?.updatedBy ?? ''),
    updatedAt: String(rec?.updatedAt ?? ''),
  };

  // Debug: Log the normalized record
  console.log('Normalized record resultHash:', normalized.resultHash);
  
  return normalized;
};
// END: Normalization utilities for Academic Records

export interface StudentHistory {
  id: string;
  studentId: string;
  action: 'created' | 'updated' | 'deleted';
  field?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface StudentStatistics {
  totalStudents: number;
  studentsByCourse: Record<string, number>;
  averageGPA: number;
  studentsByStatus: Record<string, number>;
}

export interface AcademicRecordHistory {
  id: string;
  recordId: string;
  action: 'created' | 'updated' | 'deleted';
  field?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  description: string;
}

export interface AcademicStatistics {
  totalRecords: number;
  recordsByEducationLevel: Record<string, number>;
  recordsByStream: Record<string, number>;
  averagePercentage: number;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }

  // Initialize ledger with sample data
  async initLedger(): Promise<ApiResponse<string>> {
    return this.request('/admin/init-ledger', { method: 'POST' });
  }

  // Get all students
  async getAllStudents(): Promise<ApiResponse<Student[]>> {
    const response = await this.request<{Key: string, Record: any}[]>('/students');
    
    console.log('Raw API response:', response);
    
    // Transform the data from {Key, Record} format to the desired Student[]
    let transformedData: Student[] = [];
    
    const mapRecordToStudent = (rec: any): Student => {
      const mapped: Student = {
        id: 0, // not used for keys; we use enrollmentNo in UI
        enrollmentNo: String(rec.enrollmentNo || rec.enrollId || ''),
        firstName: String(rec.firstName || rec.givenName || ''),
        lastName: String(rec.lastName || rec.surname || ''),
        fathersName: String(rec.fname || rec.fatherName || ''),
        mothersName: String(rec.mname || rec.motherName || ''),
        dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
        phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
        email: String(rec.cEmail || rec.email || ''),
        address: String(rec.cAddress || rec.address || ''),
        course: String(rec.courseType || rec.course || ''),
        admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
        status: (rec.status || 'Active') as Student['status'],
        semester: Number(rec.semester ?? 0),
        gpa: Number(rec.gpa ?? 0),
        createdBy: String(rec.createdBy || ''),
        createdAt: String(rec.createdAt || ''),
        updatedBy: String(rec.updatedBy || ''),
        updatedAt: String(rec.updatedAt || ''),
      };
      return mapped;
    };
    
    if (response.data && Array.isArray(response.data)) {
      console.log('Processing array data, length:', response.data.length);
      
      // Filter out history records and transform
      transformedData = response.data
        .filter(item => {
          const isHistory = item.Key && String(item.Key).startsWith('HISTORY_');
          console.log(`Item ${item.Key}: isHistory = ${isHistory}`);
          return !isHistory;
        })
        .map(item => {
          const rec = item.Record || item;
          if (rec && rec.docType === 'student') {
            return mapRecordToStudent(rec);
          }
          // If not expected shape, try best-effort mapping
          return mapRecordToStudent(rec);
        })
        .filter(Boolean) as Student[]; // Remove any null/undefined items
    } else if (response.data && typeof response.data === 'object') {
      // If data is an object, try to extract students from it
      const dataObj = response.data as any;
      if (dataObj.students && Array.isArray(dataObj.students)) {
        transformedData = dataObj.students.map((s: any) => mapRecordToStudent(s));
      } else if (Array.isArray(dataObj)) {
        transformedData = dataObj.map((s: any) => mapRecordToStudent(s));
      }
    }
    
    console.log('Transformed data:', transformedData);
    console.log('Transformed data length:', transformedData.length);
    
    return {
      ...response,
      data: transformedData
    };
  }

  // Get student by enrollment number
  async getStudentByEnrollment(enrollmentNo: string): Promise<ApiResponse<Student>> {
    const response = await this.request<any>(`/students/enrollment/${enrollmentNo}`);
    const rec = (response?.data?.Record ?? response?.data ?? {}) as any;
    const mapped: Student = {
      id: 0,
      enrollmentNo: String(rec.enrollmentNo || rec.enrollId || ''),
      firstName: String(rec.firstName || rec.givenName || ''),
      lastName: String(rec.lastName || rec.surname || ''),
      fathersName: String(rec.fname || rec.fatherName || ''),
      mothersName: String(rec.mname || rec.motherName || ''),
      dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
      phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
      email: String(rec.cEmail || rec.email || ''),
      address: String(rec.cAddress || rec.address || ''),
      course: String(rec.courseType || rec.course || ''),
      admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
      status: (rec.status || 'Active') as Student['status'],
      semester: Number(rec.semester ?? 0),
      gpa: Number(rec.gpa ?? 0),
      createdBy: String(rec.createdBy || ''),
      createdAt: String(rec.createdAt || ''),
      updatedBy: String(rec.updatedBy || ''),
      updatedAt: String(rec.updatedAt || ''),
    };
    return { ...response, data: mapped } as ApiResponse<Student>;
  }

  // Register new student
  async registerStudent(studentData: Student): Promise<ApiResponse<Student>> {
    const response = await this.request<Student>('/students/register', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    
    return response;
  }

  // Update student
  async updateStudent(enrollmentNo: string, updateData: Partial<Student>): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: any}>(`/students/${enrollmentNo}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const rec = response.data.Record as any;
    const mapped: Student = {
      id: 0,
      enrollmentNo: String(rec.enrollmentNo || ''),
      firstName: String(rec.firstName || ''),
      lastName: String(rec.lastName || ''),
      fathersName: String(rec.fname || rec.fathersName || ''),
      mothersName: String(rec.mname || rec.mothersName || ''),
      dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
      phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
      email: String(rec.cEmail || rec.email || ''),
      address: String(rec.cAddress || rec.address || ''),
      course: String(rec.courseType || rec.course || ''),
      admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
      status: (rec.status || 'Active') as Student['status'],
      semester: Number(rec.semester ?? 0),
      gpa: Number(rec.gpa ?? 0),
      createdBy: String(rec.createdBy || ''),
      createdAt: String(rec.createdAt || ''),
      updatedBy: String(rec.updatedBy || ''),
      updatedAt: String(rec.updatedAt || ''),
    };
    return { ...response, data: mapped } as ApiResponse<Student>;
  }

  // Delete student
  async deleteStudent(enrollmentNo: string): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: any}>(`/students/${enrollmentNo}`, {
      method: 'DELETE',
    });
    const rec = response.data.Record as any;
    const mapped: Student = {
      id: 0,
      enrollmentNo: String(rec.enrollmentNo || ''),
      firstName: String(rec.firstName || ''),
      lastName: String(rec.lastName || ''),
      fathersName: String(rec.fname || rec.fathersName || ''),
      mothersName: String(rec.mname || rec.mothersName || ''),
      dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
      phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
      email: String(rec.cEmail || rec.email || ''),
      address: String(rec.cAddress || rec.address || ''),
      course: String(rec.courseType || rec.course || ''),
      admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
      status: (rec.status || 'Active') as Student['status'],
      semester: Number(rec.semester ?? 0),
      gpa: Number(rec.gpa ?? 0),
      createdBy: String(rec.createdBy || ''),
      createdAt: String(rec.createdAt || ''),
      updatedBy: String(rec.updatedBy || ''),
      updatedAt: String(rec.updatedAt || ''),
    };
    return { ...response, data: mapped } as ApiResponse<Student>;
  }

  // Get students by course
  async getStudentsByCourse(course: string): Promise<ApiResponse<Student[]>> {
    const response = await this.request<{Key: string, Record: any}[]>(`/students/course/${course}`);
    
    const transformedData = response.data
      .filter(item => !String(item.Key).startsWith('HISTORY_'))
      .map(item => item.Record)
      .map((rec: any) => ({
        id: 0,
        enrollmentNo: String(rec.enrollmentNo || ''),
        firstName: String(rec.firstName || ''),
        lastName: String(rec.lastName || ''),
        fathersName: String(rec.fname || rec.fathersName || ''),
        mothersName: String(rec.mname || rec.mothersName || ''),
        dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
        phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
        email: String(rec.cEmail || rec.email || ''),
        address: String(rec.cAddress || rec.address || ''),
        course: String(rec.courseType || rec.course || ''),
        admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
        status: (rec.status || 'Active') as Student['status'],
        semester: Number(rec.semester ?? 0),
        gpa: Number(rec.gpa ?? 0),
        createdBy: String(rec.createdBy || ''),
        createdAt: String(rec.createdAt || ''),
        updatedBy: String(rec.updatedBy || ''),
        updatedAt: String(rec.updatedAt || ''),
      }))
      .filter(Boolean) as Student[];
    
    return {
      ...response,
      data: transformedData
    };
  }

  // Search students by name
  async searchStudentsByName(searchTerm: string): Promise<ApiResponse<Student[]>> {
    const response = await this.request<{Key: string, Record: any}[]>(`/students/search/${searchTerm}`);
    
    const transformedData = response.data
      .filter(item => !String(item.Key).startsWith('HISTORY_'))
      .map(item => item.Record)
      .map((rec: any) => ({
        id: 0,
        enrollmentNo: String(rec.enrollmentNo || ''),
        firstName: String(rec.firstName || ''),
        lastName: String(rec.lastName || ''),
        fathersName: String(rec.fname || rec.fathersName || ''),
        mothersName: String(rec.mname || rec.mothersName || ''),
        dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
        phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
        email: String(rec.cEmail || rec.email || ''),
        address: String(rec.cAddress || rec.address || ''),
        course: String(rec.courseType || rec.course || ''),
        admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
        status: (rec.status || 'Active') as Student['status'],
        semester: Number(rec.semester ?? 0),
        gpa: Number(rec.gpa ?? 0),
        createdBy: String(rec.createdBy || ''),
        createdAt: String(rec.createdAt || ''),
        updatedBy: String(rec.updatedBy || ''),
        updatedAt: String(rec.updatedAt || ''),
      }))
      .filter(Boolean) as Student[];
    
    return {
      ...response,
      data: transformedData
    };
  }

  // Update student GPA
  async updateStudentGPA(enrollmentNo: string, gpa: number): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: any}>(`/students/${enrollmentNo}/gpa`, {
      method: 'PUT',
      body: JSON.stringify({ gpa }),
    });
    const rec = response.data.Record as any;
    const mapped: Student = {
      id: 0,
      enrollmentNo: String(rec.enrollmentNo || ''),
      firstName: String(rec.firstName || ''),
      lastName: String(rec.lastName || ''),
      fathersName: String(rec.fname || rec.fathersName || ''),
      mothersName: String(rec.mname || rec.mothersName || ''),
      dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
      phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
      email: String(rec.cEmail || rec.email || ''),
      address: String(rec.cAddress || rec.address || ''),
      course: String(rec.courseType || rec.course || ''),
      admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
      status: (rec.status || 'Active') as Student['status'],
      semester: Number(rec.semester ?? 0),
      gpa: Number(rec.gpa ?? 0),
      createdBy: String(rec.createdBy || ''),
      createdAt: String(rec.createdAt || ''),
      updatedBy: String(rec.updatedBy || ''),
      updatedAt: String(rec.updatedAt || ''),
    };
    
    // Transform the data to simple object
    return {
      ...response,
      data: mapped
    } as ApiResponse<Student>;
  }

  // Transfer student course
  async transferStudentCourse(enrollmentNo: string, newCourse: string): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: any}>(`/students/${enrollmentNo}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ newCourse }),
    });
    const rec = response.data.Record as any;
    const mapped: Student = {
      id: 0,
      enrollmentNo: String(rec.enrollmentNo || ''),
      firstName: String(rec.firstName || ''),
      lastName: String(rec.lastName || ''),
      fathersName: String(rec.fname || rec.fathersName || ''),
      mothersName: String(rec.mname || rec.mothersName || ''),
      dateOfBirth: String(rec.dob || rec.dateOfBirth || ''),
      phoneNo: rec.cPhone != null ? String(rec.cPhone) : String(rec.phoneNo || ''),
      email: String(rec.cEmail || rec.email || ''),
      address: String(rec.cAddress || rec.address || ''),
      course: String(rec.courseType || rec.course || ''),
      admissionDate: String(rec.dateofadmission || rec.admissionDate || ''),
      status: (rec.status || 'Active') as Student['status'],
      semester: Number(rec.semester ?? 0),
      gpa: Number(rec.gpa ?? 0),
      createdBy: String(rec.createdBy || ''),
      createdAt: String(rec.createdAt || ''),
      updatedBy: String(rec.updatedBy || ''),
      updatedAt: String(rec.updatedAt || ''),
    };
    
    // Transform the data to simple object
    return {
      ...response,
      data: mapped
    } as ApiResponse<Student>;
  }

  // Get student statistics
  async getStudentStatistics(): Promise<ApiResponse<StudentStatistics>> {
    return this.request('/students/statistics');
  }

  // Get student history
  async getStudentHistory(enrollmentNo: string): Promise<ApiResponse<{enrollmentNo: string, currentData: any, history: StudentHistory[], totalRecords: number}>> {
    const response = await this.request<{enrollmentNo: string, currentData: any, history: StudentHistory[], totalRecords: number}>(`/students/${enrollmentNo}/history`);
    return response;
  }

  // Create student with history tracking
  async createStudent(studentData: Student): Promise<ApiResponse<Student>> {
    const response = await this.request<Student>('/students/register', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    
    return response;
  }

  // Update student with history tracking
  async updateStudentWithHistory(enrollmentNo: string, updateData: Partial<Student>): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: Student}>(`/students/${enrollmentNo}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    // Transform the data from {Key, Record} format to simple object
    return {
      ...response,
      data: response.data.Record
    };
  }

  // Delete student with history tracking
  async deleteStudentWithHistory(enrollmentNo: string): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: Student}>(`/students/${enrollmentNo}`, {
      method: 'DELETE',
    });
    
    // Transform the data from {Key, Record} format to simple object
    return {
      ...response,
      data: response.data.Record
    };
  }

  // Academic Records API Methods

  // Health check for academic records API
  async getAcademicHealth(): Promise<ApiResponse<any>> {
    const url = `${ACADEMIC_API_BASE_URL}/health`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Initialize academic records ledger
  async initAcademicLedger(): Promise<ApiResponse<string>> {
    const url = `${ACADEMIC_API_BASE_URL}/admin/init-ledger`;
    try {
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get all academic records
  async getAllAcademicRecords(): Promise<ApiResponse<AcademicRecord[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      const envelope: any = data;
      const payload = 'data' in envelope ? envelope.data : envelope;
      const list: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.records) ? payload.records : [];
      
      // Debug: Log the first record to see the structure
      if (list.length > 0) {
        console.log('Raw API record structure:', list[0]);
        console.log('Available fields:', Object.keys(list[0]));
        console.log('ResultHash field value:', list[0]?.resultHash);
        
        // Check for common variations of resultHash field names
        const possibleHashFields = ['resultHash', 'hash', 'result_hash', 'blockchainHash', 'txHash', 'recordHash'];
        for (const field of possibleHashFields) {
          if (list[0][field]) {
            console.log(`Found hash field "${field}":`, list[0][field]);
          }
        }
      }
      
      const normalized = list.map((r: any) => normalizeExternalSemesterResult(r));

      return { ...envelope, data: normalized };
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic record by ID
  async getAcademicRecordById(recordId: string): Promise<ApiResponse<AcademicRecord>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/${recordId}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      const envelope: any = data;
      const payload = 'data' in envelope ? envelope.data : envelope;
      const rec = Array.isArray(payload) ? payload[0] : payload;
      const normalized = normalizeExternalSemesterResult(rec);

      return { ...envelope, data: normalized } as ApiResponse<AcademicRecord>;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic records by enrollment number
  async getAcademicRecordsByEnrollment(enrollmentNo: string): Promise<ApiResponse<AcademicRecord[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/enrollment/${enrollmentNo}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      const envelope: any = data;
      const payload = 'data' in envelope ? envelope.data : envelope;
      let list: any[] = Array.isArray(payload) ? payload : (payload ? [payload] : []);
      const normalized = list.map((r: any) => normalizeExternalSemesterResult(r));
      return { ...envelope, data: normalized };
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Create new academic record
  async createAcademicRecord(recordData: Partial<AcademicRecord>): Promise<ApiResponse<AcademicRecord>> {
    const url = `${ACADEMIC_API_BASE_URL}/records`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      const envelope: any = data;
      const payload = 'data' in envelope ? envelope.data : envelope;
      const normalized = normalizeExternalSemesterResult(payload);

      return { ...envelope, data: normalized } as ApiResponse<AcademicRecord>;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Update academic record
  async updateAcademicRecord(recordId: string, updateData: Partial<AcademicRecord>): Promise<ApiResponse<AcademicRecord>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/${recordId}`;
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Delete academic record
  async deleteAcademicRecord(recordId: string): Promise<ApiResponse<AcademicRecord>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/${recordId}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic record history
  async getAcademicRecordHistory(recordId: string): Promise<ApiResponse<AcademicRecordHistory[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/${recordId}/history`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }

      // Normalize response shape -> always return data: AcademicRecordHistory[]
      const envelope: any = data;
      const raw = envelope && 'data' in envelope ? envelope.data : envelope;

      let items: any[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && Array.isArray(raw.history)) {
        items = raw.history;
      } else if (raw && raw.item) {
        items = [raw.item];
      }

      const normalized: AcademicRecordHistory[] = [];
      items.forEach((it: any, idx: number) => {
        const baseTimestamp = it?.changedAt || it?.timestamp || it?.blockTime || it?.txTimestamp || it?.time || it?.date || '';
        const baseAction = String(it?.action || it?.event || it?.type || 'updated').toLowerCase();
        const who = it?.changedBy || it?.invoker || it?.user || it?.mspId || '';

        const pushEntry = (field?: string, oldValue?: any, newValue?: any, description?: string) => {
          normalized.push({
            id: it?.id || `${recordId}-${idx}-${field || 'record'}-${baseTimestamp || idx}`,
            recordId,
            action: (baseAction === 'create' ? 'created' : baseAction === 'delete' ? 'deleted' : (baseAction as 'created' | 'updated' | 'deleted')),
            field,
            oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : undefined,
            newValue: newValue !== undefined && newValue !== null ? String(newValue) : undefined,
            changedBy: String(who || ''),
            changedAt: String(baseTimestamp || ''),
            description: description || it?.description || (field ? `${field} updated from "${oldValue ?? ''}" to "${newValue ?? ''}"` : 'Record updated')
          });
        };

        // 1) Direct field/old/new at top level
        if (it?.field && (it?.oldValue !== undefined || it?.newValue !== undefined)) {
          pushEntry(it.field, it.oldValue, it.newValue, it.description);
          return;
        }
        if ((it?.fieldName || it?.name) && (it?.old !== undefined || it?.new !== undefined)) {
          pushEntry(it.fieldName || it.name, it.old, it.new, it.description);
          return;
        }

        // 2) Common nested structures
        if (it?.details && (it.details.field || it.details.fieldName)) {
          const d = it.details;
          pushEntry(d.field || d.fieldName, d.oldValue ?? d.old, d.newValue ?? d.new, it.description);
          return;
        }

        // 3) Changes-like maps
        if (it?.changes && typeof it.changes === 'object') {
          Object.keys(it.changes).forEach((field) => {
            const change = it.changes[field];
            const oldVal = change?.old ?? change?.oldValue ?? change?.from;
            const newVal = change?.new ?? change?.newValue ?? change?.to;
            pushEntry(field, oldVal, newVal);
          });
          return;
        }
        if (it?.diff && typeof it.diff === 'object') {
          Object.keys(it.diff).forEach((field) => {
            const change = it.diff[field];
            const oldVal = change?.old ?? change?.from;
            const newVal = change?.new ?? change?.to;
            pushEntry(field, oldVal, newVal);
          });
          return;
        }

        // 4) Array of updates
        if (Array.isArray(it?.updates)) {
          it.updates.forEach((u: any) => {
            pushEntry(u?.field || u?.fieldName, u?.old ?? u?.oldValue ?? u?.from, u?.new ?? u?.newValue ?? u?.to);
          });
          if (it?.updates.length === 0) {
            pushEntry(undefined, undefined, undefined, it?.description || 'Record updated');
          }
          return;
        }

        // 5) Object diffs: old/new pairs
        const oldObj = it?.old || it?.oldData || it?.previous || it?.before || it?.previousRecord;
        const newObj = it?.new || it?.newData || it?.current || it?.after || it?.updatedRecord;
        if (oldObj && newObj && typeof oldObj === 'object' && typeof newObj === 'object') {
          const fields = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
          let pushed = false;
          fields.forEach((field) => {
            const oldVal = oldObj[field];
            const newVal = newObj[field];
            const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
            if (changed) {
              pushed = true;
              pushEntry(field, oldVal, newVal);
            }
          });
          if (!pushed) {
            pushEntry(undefined, undefined, undefined, it?.description || 'Record updated');
          }
          return;
        }

        // 6) Fallback: generic entry
        pushEntry(undefined, undefined, undefined, it?.description || 'Record updated');
      });

      return { ...envelope, data: normalized } as ApiResponse<AcademicRecordHistory[]>;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic records by education level
  async getAcademicRecordsByEducationLevel(educationLevel: string): Promise<ApiResponse<AcademicRecord[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/level/${educationLevel}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Search academic records by institution
  async searchAcademicRecordsByInstitution(searchTerm: string): Promise<ApiResponse<AcademicRecord[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/search/institution/${searchTerm}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic statistics
  async getAcademicStatistics(): Promise<ApiResponse<AcademicStatistics>> {
    const url = `${ACADEMIC_API_BASE_URL}/statistics`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Bulk create academic records
  async bulkCreateAcademicRecords(records: Partial<AcademicRecord>[]): Promise<ApiResponse<any>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/bulk`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic records by stream
  async getAcademicRecordsByStream(stream: string): Promise<ApiResponse<AcademicRecord[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/stream/${stream}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Get academic records by year range
  async getAcademicRecordsByYearRange(startYear: string, endYear: string): Promise<ApiResponse<AcademicRecord[]>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/year-range?startYear=${startYear}&endYear=${endYear}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Academic API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Academic API Error:', error);
      throw error;
    }
  }

  // Decrypt QR code data and lookup academic record
  async decryptQRAndGetAcademicRecord(encryptedData: string): Promise<ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string}>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/decrypt-qr`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'QR decryption failed');
      }
      
      const envelope: any = data;
      const payload = 'data' in envelope ? envelope.data : envelope;
      const allSemesters = envelope.allSemesters || [];
      
      // Normalize the primary record
      const normalizedPrimary = normalizeExternalSemesterResult(payload);
      
      // Normalize all semester records
      const normalizedAllSemesters = allSemesters.map((r: any) => normalizeExternalSemesterResult(r));

      return { 
        ...envelope, 
        data: {
          data: normalizedPrimary,
          allSemesters: normalizedAllSemesters,
          source: envelope.source || 'unknown'
        }
      } as ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string}>;
    } catch (error) {
      console.error('QR Decryption API Error:', error);
      throw error;
    }
  }

  // Decrypt QR data from URL and lookup academic record
  async decryptQRFromURLAndGetRecord(encryptedData: string): Promise<ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string}>> {
    try {
      // URL decode the encrypted data first
      const decodedData = decodeURIComponent(encryptedData);
      
      // Decrypt the data
      const decryptedData = await decryptAESFrontend(decodedData);
      console.log('Decrypted QR data:', decryptedData);
      
      // Parse the decrypted JSON data
      const qrData = JSON.parse(decryptedData);
      
      // Extract parameters from QR data
      const { enrollmentNo, cycle, examMonth, examYear, examType, resultHash } = qrData;
      
      if (!enrollmentNo) {
        throw new Error('Enrollment number is required in QR data');
      }

      // Try to get the specific record first using unique fields
      if (cycle && examMonth && examYear && examType && resultHash) {
        try {
          const url = `${ACADEMIC_API_BASE_URL}/records/unique?enrollmentNo=${encodeURIComponent(enrollmentNo)}&cycle=${encodeURIComponent(cycle)}&examMonth=${encodeURIComponent(examMonth)}&examYear=${encodeURIComponent(examYear)}&examType=${encodeURIComponent(examType)}&resultHash=${encodeURIComponent(resultHash)}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (response.ok && data.success && data.data) {
            const normalizedPrimary = normalizeExternalSemesterResult(data.data);
            const normalizedAllSemesters = (data.allSemesters || []).map((r: any) => normalizeExternalSemesterResult(r));
            
            return {
              success: true,
              data: {
                data: normalizedPrimary,
                allSemesters: normalizedAllSemesters,
                source: 'unique-fields'
              }
            } as ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string}>;
          }
        } catch (error) {
          console.log('Specific record not found, trying enrollment lookup');
        }
      }

      // Fallback: Get all records for the enrollment number
      const allSemestersResponse = await this.getAcademicRecordsByEnrollment(enrollmentNo);
      
      if (!allSemestersResponse.success || !Array.isArray(allSemestersResponse.data) || allSemestersResponse.data.length === 0) {
        throw new Error('No academic records found for this enrollment number');
      }

      return {
        success: true,
        data: {
          data: allSemestersResponse.data[0], // Return first record as primary
          allSemesters: allSemestersResponse.data,
          source: 'enrollment-lookup'
        }
      } as ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string}>;

    } catch (error) {
      console.error('QR decryption and lookup failed:', error);
      throw error;
    }
  }

  // Decrypt QR data from URL using backend API
  async decryptQRFromURL(encryptedData: string): Promise<ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string, qrData: any}>> {
    const url = `${ACADEMIC_API_BASE_URL}/records/decrypt-url?data=${encodeURIComponent(encryptedData)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'QR decryption failed');
      }
      
      const envelope: any = data;
      const payload = 'data' in envelope ? envelope.data : envelope;
      const allSemesters = envelope.allSemesters || [];
      const qrData = envelope.qrData || {};
      
      // Normalize the primary record
      const normalizedPrimary = normalizeExternalSemesterResult(payload);
      
      // Normalize all semester records
      const normalizedAllSemesters = allSemesters.map((r: any) => normalizeExternalSemesterResult(r));

      return { 
        ...envelope, 
        data: {
          data: normalizedPrimary,
          allSemesters: normalizedAllSemesters,
          source: envelope.source || 'unknown',
          qrData: qrData
        }
      } as ApiResponse<{data: AcademicRecord, allSemesters: AcademicRecord[], source: string, qrData: any}>;
    } catch (error) {
      console.error('QR Decryption API Error:', error);
      throw error;
    }
  }

  // Comprehensive QR code scanning and marksheet display
  async scanQRAndDisplayMarksheet(encryptedData: string): Promise<ApiResponse<{
    primaryRecord: AcademicRecord,
    allSemesters: AcademicRecord[],
    source: string,
    qrData: any,
    isFound: boolean
  }>> {
    try {
      // First try the backend decryption endpoint
      const response = await this.decryptQRFromURL(encryptedData);
      
      if (response.success && response.data.data) {
        return {
          success: true,
          message: 'QR code scanned successfully',
          data: {
            primaryRecord: response.data.data,
            allSemesters: response.data.allSemesters,
            source: response.data.source,
            qrData: response.data.qrData,
            isFound: true
          }
        } as ApiResponse<{
          primaryRecord: AcademicRecord,
          allSemesters: AcademicRecord[],
          source: string,
          qrData: any,
          isFound: boolean
        }>;
      }
      
      // If not found, return not found response
      return {
        success: false,
        message: 'No records found for this QR code',
        data: {
          primaryRecord: {} as AcademicRecord,
          allSemesters: [],
          source: 'not-found',
          qrData: {},
          isFound: false
        }
      } as ApiResponse<{
        primaryRecord: AcademicRecord,
        allSemesters: AcademicRecord[],
        source: string,
        qrData: any,
        isFound: boolean
      }>;
      
    } catch (error) {
      console.error('QR scanning failed:', error);
      return {
        success: false,
        message: 'Failed to scan QR code',
        data: {
          primaryRecord: {} as AcademicRecord,
          allSemesters: [],
          source: 'error',
          qrData: {},
          isFound: false
        }
      } as ApiResponse<{
        primaryRecord: AcademicRecord,
        allSemesters: AcademicRecord[],
        source: string,
        qrData: any,
        isFound: boolean
      }>;
    }
  }


}

// AES Decryption Configuration for Frontend
const AES_KEY = '1234567890123456'; // 16 bytes
const AES_IV = '6543210987654321';  // 16 bytes

// AES Decryption Function for Frontend using Web Crypto API
async function decryptAESFrontend(encryptedData: string): Promise<string> {
    try {
        // Decode base64
        const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Import key
        const keyData = new TextEncoder().encode(AES_KEY);
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );
        
        // Prepare IV
        const iv = new TextEncoder().encode(AES_IV);
        
        // Decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            key,
            encryptedBuffer
        );
        
        // Convert to string
        return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
        console.error('Frontend AES Decryption failed:', error);
        throw new Error('Failed to decrypt QR code data');
    }
}

export const apiService = new ApiService(); 