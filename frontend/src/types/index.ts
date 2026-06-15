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

export interface AcademicHistory {
  id: string;
  recordId: string;
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

// NEW: Semester Result schema replacing previous AcademicRecord fields
export interface SemesterResultCandidate {
  name: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string; // ISO date string
  registrationNumber: string;
}

export interface SemesterResultExamination {
  name: string; // e.g., course/program name
  semester: string; // e.g., FIRST SEMESTER
  examType: string; // e.g., FRESH
  capacity: string; // e.g., REGULAR
  collegeName: string;
  examCenterName: string;
  examMonthYear: string; // e.g., MARCH 2020
}

export interface SemesterResultMarksObtained {
  TH: number | null;
  IA: number | null;
  PR: number | null;
  GR: number | null;
  TOTAL: number | string; // may be "R" for Reappear
}

export interface SemesterResultMarksDetail {
  sNo: number;
  paperCode: string;
  paperName: string;
  category: string; // Compulsory/Optional
  marksObtained: SemesterResultMarksObtained;
  minimumPassingMarks: number;
  maximumMarks: number;
}

export interface SemesterResultSummary {
  totalMarks: number | null;
  result: string; // e.g., Reappear/Pass
  reappearPaperCodes?: string[];
}

export interface SemesterResultDates {
  resultDeclaration: string; // ISO date
  settlementDate: string; // ISO date
}

export interface SemesterResultVerification {
  verifiedBy: string;
  controllerSignature: boolean;
}

export interface SemesterResultDownloadInfo {
  downloadedBy: string;
  downloadDate: string; // timestamp string
}

export interface SemesterResultGradingLegend {
  TH: string;
  IA: string;
  PR: string;
  MO: string;
  MPM: string;
  MM: string;
  A: string;
  R: string;
  UMC: string;
  GR: string;
}

// Primary record type used by the Academic UI and API
export interface SemesterResult {
  id: number; // local UI id
  // Keep a generic recordId used by history endpoints; we derive it from serial/exam roll
  recordId: string;
  serialNumber: string;
  examRollNumber: string;
  resultHash?: string; // Hash from the blockchain API for unique identification
  university: string;
  naacAccreditation: string;
  resultType: string;
  candidate: SemesterResultCandidate;
  examination: SemesterResultExamination;
  marksDetails: SemesterResultMarksDetail[];
  resultSummary: SemesterResultSummary;
  resultDates: SemesterResultDates;
  verification: SemesterResultVerification;
  downloadInfo?: SemesterResultDownloadInfo;
  gradingLegend?: SemesterResultGradingLegend;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// Backwards-compatibility alias so existing imports continue to work
export type AcademicRecord = SemesterResult;

// Form data for creating a SemesterResult in the UI (JSON-based)
export interface AcademicFormData {
  rawJson: string; // user pastes JSON; we parse and validate before submit
} 