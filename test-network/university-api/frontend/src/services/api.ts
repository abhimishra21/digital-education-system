const API_BASE_URL = 'http://135.235.51.143:3001/api';
const ACADEMIC_API_BASE_URL = 'http://135.235.51.143:3002/api/academic';

import { Student, AcademicRecord } from '../types';

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
    const response = await this.request<{Key: string, Record: Student}[]>('/students');
    
    console.log('Raw API response:', response);
    
    // Transform the data from {Key, Record} format to simple array
    let transformedData: Student[] = [];
    
    if (response.data && Array.isArray(response.data)) {
      console.log('Processing array data, length:', response.data.length);
      
      // Filter out history records and transform
      transformedData = response.data
        .filter(item => {
          const isHistory = item.Key && item.Key.startsWith('HISTORY_');
          console.log(`Item ${item.Key}: isHistory = ${isHistory}`);
          return !isHistory;
        })
        .map(item => {
          console.log('Processing item:', item);
          if (item.Record) {
            console.log('Returning Record:', item.Record);
            return item.Record;
          } else {
            console.log('No Record found, returning item as Student');
            return item as unknown as Student;
          }
        })
        .filter(Boolean); // Remove any null/undefined items
    } else if (response.data && typeof response.data === 'object') {
      // If data is an object, try to extract students from it
      const dataObj = response.data as any;
      if (dataObj.students && Array.isArray(dataObj.students)) {
        transformedData = dataObj.students;
      } else if (Array.isArray(dataObj)) {
        transformedData = dataObj;
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
    const response = await this.request<Student>(`/students/enrollment/${enrollmentNo}`);
    
    return response;
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

  // Delete student
  async deleteStudent(enrollmentNo: string): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: Student}>(`/students/${enrollmentNo}`, {
      method: 'DELETE',
    });
    
    // Transform the data from {Key, Record} format to simple object
    return {
      ...response,
      data: response.data.Record
    };
  }

  // Get students by course
  async getStudentsByCourse(course: string): Promise<ApiResponse<Student[]>> {
    const response = await this.request<{Key: string, Record: Student}[]>(`/students/course/${course}`);
    
    // Transform the data from {Key, Record} format to simple array
    const transformedData = response.data
      .filter(item => !item.Key.startsWith('HISTORY_')) // Filter out history records
      .map(item => item.Record)
      .filter(Boolean);
    
    return {
      ...response,
      data: transformedData
    };
  }

  // Search students by name
  async searchStudentsByName(searchTerm: string): Promise<ApiResponse<Student[]>> {
    const response = await this.request<{Key: string, Record: Student}[]>(`/students/search/${searchTerm}`);
    
    // Transform the data from {Key, Record} format to simple array
    const transformedData = response.data
      .filter(item => !item.Key.startsWith('HISTORY_')) // Filter out history records
      .map(item => item.Record)
      .filter(Boolean);
    
    return {
      ...response,
      data: transformedData
    };
  }

  // Update student GPA
  async updateStudentGPA(enrollmentNo: string, gpa: number): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: Student}>(`/students/${enrollmentNo}/gpa`, {
      method: 'PUT',
      body: JSON.stringify({ gpa }),
    });
    
    // Transform the data from {Key, Record} format to simple object
    return {
      ...response,
      data: response.data.Record
    };
  }

  // Transfer student course
  async transferStudentCourse(enrollmentNo: string, newCourse: string): Promise<ApiResponse<Student>> {
    const response = await this.request<{Key: string, Record: Student}>(`/students/${enrollmentNo}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ newCourse }),
    });
    
    // Transform the data from {Key, Record} format to simple object
    return {
      ...response,
      data: response.data.Record
    };
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
      
      return data;
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
      
      return data;
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
      
      return data;
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
      
      return data;
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
      
      return data;
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


}

export const apiService = new ApiService(); 