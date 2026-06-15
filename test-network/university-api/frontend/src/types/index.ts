export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Student {
  id: number;
  enrollmentNo: string;
  firstName: string;
  lastName: string;
  fathersName: string;
  mothersName: string;
  dateOfBirth: string;
  phoneNo: string;
  email: string;
  address: string;
  course: string;
  admissionDate: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended';
  semester: number;
  gpa: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface StudentHistory {
  id: string;
  studentId: string;
  action: 'created' | 'updated' | 'deleted' | 'current';
  field?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  description: string;
}

export interface FormData {
  firstName: string;
  lastName: string;
  fathersName: string;
  mothersName: string;
  dateOfBirth: string;
  phoneNo: string;
  email: string;
  address: string;
  course: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended';
  semester: number;
  gpa: number;
}

export interface Message {
  type: 'success' | 'error';
  text: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  isLoading: boolean;
}

export interface AcademicRecord {
  id: number;
  recordId: string;
  enrollmentNo: string;
  educationLevel: string;
  schoolOrCollegeName: string;
  boardOrUniversityName: string;
  institutionAddress: string;
  institutionCode: string;
  startYear: string;
  endYear: string;
  passingYear: string;
  stream: string;
  majorSubjects: string;
  optionalSubjects: string;
  percentage: string;
  grade: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AcademicFormData {
  recordId: string;
  enrollmentNo: string;
  educationLevel: string;
  schoolOrCollegeName: string;
  boardOrUniversityName: string;
  institutionAddress: string;
  institutionCode: string;
  startYear: string;
  endYear: string;
  passingYear: string;
  stream: string;
  majorSubjects: string;
  optionalSubjects: string;
  percentage: string;
  grade: string;
} 