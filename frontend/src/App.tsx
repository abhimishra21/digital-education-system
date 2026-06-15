import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  Search,
  Download,
  History,
  Database,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { StudentHistory, FormData, Message, Student } from './types';
import { apiService } from './services/api';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';
import LoginPanel from './components/LoginPanel';
import HistoryModal from './components/HistoryModal';
import EditStudentModal from './components/EditStudentModal';
import Navigation from './components/Navigation';
import AcademicRecords from './components/AcademicRecords';

const App: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'students' | 'academic'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [studentHistory, setStudentHistory] = useState<StudentHistory[]>([]);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    fathersName: '',
    mothersName: '',
    dateOfBirth: '',
    phoneNo: '',
    email: '',
    address: '',
    course: '',
    status: 'Active',
    semester: 1,
    gpa: 0.0
  });
  const [message, setMessage] = useState<Message>({ type: 'success', text: '' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  // State for pagination
  const [currentStudentPage, setCurrentStudentPage] = useState(1);
  const [studentsPerPage] = useState(6);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Intersection Observer for animations
  const [headerRef, headerInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [formRef, formInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [listRef, listInView] = useInView({ threshold: 0.1, triggerOnce: true });

  // Load students from API and check connection
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      await apiService.getHealth();
      setIsApiConnected(true);
      
      const response = await apiService.getAllStudents();
      console.log('API Response:', response);
      console.log('Students data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setStudents(response.data);
        if (response.data.length === 0) {
          setMessage({ type: 'success', text: 'Connected to blockchain successfully! No students found. Try initializing the ledger.' });
          setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
        } else {
          setMessage({ type: 'success', text: 'Connected to blockchain successfully!' });
          setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
        }
      } else {
        console.error('Invalid data format received:', response.data);
        setMessage({ type: 'error', text: 'Invalid data format received from API' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      setIsApiConnected(false);
      setMessage({ type: 'error', text: 'Failed to connect to blockchain. Please check if the API server is running.' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);



  // Save history to localStorage (keeping this for now)
  useEffect(() => {
    localStorage.setItem('studentHistory', JSON.stringify(studentHistory));
  }, [studentHistory]);

  // Generate unique enrollment number
  const generateEnrollmentNumber = useCallback((): string => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EN${year}${randomNum}`;
  }, []);

  // Add history entry




  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to perform this action' });
      return;
    }

    if (!isApiConnected) {
      setMessage({ type: 'error', text: 'Not connected to blockchain. Please check API connection.' });
      return;
    }

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.fathersName || !formData.mothersName || 
        !formData.dateOfBirth || !formData.phoneNo || !formData.email || !formData.address || !formData.course) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
      return;
    }

    setIsLoading(true);

    try {
      // Create new student data for API
      const newStudentData: Student = {
        id: Date.now(), // Generate a unique ID
        enrollmentNo: generateEnrollmentNumber(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        fathersName: formData.fathersName,
        mothersName: formData.mothersName,
        dateOfBirth: formData.dateOfBirth,
        phoneNo: formData.phoneNo,
        email: formData.email,
        address: formData.address,
        course: formData.course,
        status: formData.status,
        semester: formData.semester,
        gpa: formData.gpa,
        admissionDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        createdAt: new Date().toISOString()
      };

      // Register student on blockchain with history tracking
      const response = await apiService.createStudent(newStudentData);
      
      // Add student to local state
      setStudents(prev => [response.data, ...prev]);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        fathersName: '',
        mothersName: '',
        dateOfBirth: '',
        phoneNo: '',
        email: '',
        address: '',
        course: '',
        status: 'Active',
        semester: 1,
        gpa: 0.0
      });

      // Show success message
      setMessage({ 
        type: 'success', 
        text: `Student ${formData.firstName} ${formData.lastName} enrolled successfully on blockchain with history tracking. ID: ${newStudentData.enrollmentNo}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } catch (error) {
      console.error('Failed to register student:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to register student: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };



  // View student history
  const viewStudentHistory = async (student: Student) => {
    try {
      setIsLoading(true);
      // Fetch history from blockchain API
      const response = await apiService.getStudentHistory(student.enrollmentNo);
      setStudentHistory(response.data.history);
    setSelectedStudent(student);
    setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch student history:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to fetch student history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit student (disabled in UI)

  // Save student changes
  const saveStudentChanges = async (
    enrollmentNo: string, 
    updatedData: FormData
  ) => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to perform this action' });
      return;
    }

    if (!isApiConnected) {
      setMessage({ type: 'error', text: 'Not connected to blockchain. Please check API connection.' });
      return;
    }

    setIsEditLoading(true);

    try {
      // Prepare update data for API
      const updateData = {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        fathersName: updatedData.fathersName,
        mothersName: updatedData.mothersName,
        dateOfBirth: updatedData.dateOfBirth,
        phoneNo: updatedData.phoneNo,
        email: updatedData.email,
        address: updatedData.address,
        course: updatedData.course,
        status: updatedData.status,
        semester: updatedData.semester,
        gpa: updatedData.gpa
      };

      // Update student on blockchain with history tracking
      await apiService.updateStudentWithHistory(enrollmentNo, updateData);

      // Reload students from API to ensure consistency
      await loadStudents();

      setIsEditModalOpen(false);
      setSelectedStudent(null);
      setMessage({ type: 'success', text: 'Student updated successfully on blockchain with history tracking' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to update student:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to update student: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsEditLoading(false);
    }
  };



  // Filter and search students
  const filteredStudents = students.filter(student => {
    try {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        (student.firstName && student.firstName.toLowerCase().includes(searchLower)) ||
        (student.lastName && student.lastName.toLowerCase().includes(searchLower)) ||
        (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(searchLower)) ||
        (student.fathersName && student.fathersName.toLowerCase().includes(searchLower)) ||
        (student.mothersName && student.mothersName.toLowerCase().includes(searchLower)) ||
        (student.email && student.email.toLowerCase().includes(searchLower)) ||
        (student.phoneNo && student.phoneNo.toLowerCase().includes(searchLower)) ||
        `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(searchLower);
      
      const matchesFilter = !filterCourse || (student.course && student.course === filterCourse);
      return matchesSearch && matchesFilter;
    } catch (error) {
      console.error('Error filtering student:', student, error);
      return false;
    }
  });

  // Get unique courses for filter
  const uniqueCourses = [...new Set(students.map(student => student.course))];

  // Calculate statistics
  const totalStudents = students.length;
  const courseStats = students.reduce((acc, student) => {
    acc[student.course] = (acc[student.course] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostPopularCourse = Object.keys(courseStats).reduce((a, b) => 
    courseStats[a] > courseStats[b] ? a : b, '');

  // Export data
  const exportData = (): void => {
    const dataStr = JSON.stringify(students, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'university-students.json';
    link.click();
    URL.revokeObjectURL(url);
  };



  // Calculate pagination
  const indexOfLastStudent = currentStudentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Toggle student expansion
  const toggleStudentExpansion = (enrollmentNo: string) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(enrollmentNo)) {
        newSet.delete(enrollmentNo);
      } else {
        newSet.add(enrollmentNo);
      }
      return newSet;
    });
  };

  // Pagination handlers
  const goToPage = (pageNumber: number) => {
    setCurrentStudentPage(pageNumber);
    setExpandedStudents(new Set()); // Reset expanded students when changing pages
  };

  const nextPage = () => {
    if (currentStudentPage < totalPages) {
      goToPage(currentStudentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentStudentPage > 1) {
      goToPage(currentStudentPage - 1);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
       transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Show login panel if not authenticated
  if (authLoading) {
    return (
      <div className="login-container">
        <LoadingSpinner size={32} text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <LoginPanel />;
  }

  return (
    <div className="container">
      {/* Navigation */}
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* Conditional Page Rendering */}
      {currentPage === 'students' ? (
        <>
          {/* Header */}
          <motion.div 
            ref={headerRef}
            className="header"
            initial={{ opacity: 0, y: -50 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={headerInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <GraduationCap size={48} style={{ display: 'inline', marginRight: '16px' }} />
          University Admission Portal
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          Blockchain-powered student enrollment management with advanced security by Expedien Esolutions.
        </motion.p>
        
        {/* Blockchain Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="blockchain-status"
        >
          <div className={`status-indicator ${isApiConnected ? 'connected' : 'disconnected'}`}>
            <Database size={16} />
            <span>{isApiConnected ? 'Connected to Blockchain' : 'Disconnected from Blockchain'}</span>
          </div>
          
          {!isApiConnected && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                className="init-ledger-btn"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await apiService.initLedger();
                    setMessage({ type: 'success', text: 'Blockchain ledger initialized with sample data!' });
                    setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
                    // Reload students after initialization
                    const response = await apiService.getAllStudents();
                    console.log('After init - API Response:', response);
                    if (response.data && Array.isArray(response.data)) {
                      setStudents(response.data);
                      setIsApiConnected(true);
                    } else {
                      console.error('Invalid data format after initialization:', response.data);
                      setMessage({ type: 'error', text: 'Invalid data format received after initialization' });
                      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
                    }
                  } catch (error) {
                    console.error('Failed to initialize ledger:', error);
                    setMessage({ type: 'error', text: 'Failed to initialize blockchain ledger' });
                    setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Initialize Ledger
              </motion.button>
              <motion.button
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const response = await apiService.getAllStudents();
                    if (response.data && Array.isArray(response.data)) {
                      setStudents(response.data);
                      setIsApiConnected(true);
                      setMessage({ type: 'success', text: 'Connection restored!' });
                      setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
                    }
                  } catch (error) {
                    console.error('Failed to retry connection:', error);
                    setMessage({ type: 'error', text: 'Still unable to connect to API' });
                    setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry Connection
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Statistics Dashboard */}
      {totalStudents > 0 && (
        <motion.div 
          ref={statsRef}
          className="stats-section"
          initial={{ opacity: 0, y: 30 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{uniqueCourses.length}</div>
            <div className="stat-label">Active Courses</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{mostPopularCourse}</div>
            <div className="stat-label">Most Popular Course</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{new Date().getFullYear()}</div>
            <div className="stat-label">Academic Year</div>
          </motion.div>
        </motion.div>
      )}

      {/* Message Display */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Notification
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ type: 'success', text: '' })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admission Form Accordion */}
      <motion.div 
        ref={formRef}
        className="card accordion-card"
        initial={{ opacity: 0, y: 50 }}
        animate={formInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="accordion-header"
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.h2 
            className="section-title"
            style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            initial={{ opacity: 0, x: -20 }}
            animate={formInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Plus size={24} />
              New Student Admission
            </div>
            <motion.div
              animate={{ rotate: isFormExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={24} />
            </motion.div>
          </motion.h2>
        </motion.div>
        
        <AnimatePresence>
          {isFormExpanded && (
            <motion.div
              className="accordion-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
        <form onSubmit={handleSubmit}>
          <motion.div 
            className="grid grid-2"
            variants={containerVariants}
            initial="hidden"
            animate={formInView ? "visible" : "hidden"}
          >
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter first name"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter last name"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Father's Name *</label>
              <input
                type="text"
                name="fathersName"
                value={formData.fathersName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter father's full name"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Mother's Name *</label>
              <input
                type="text"
                name="mothersName"
                value={formData.mothersName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter mother's full name"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="form-input"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter phone number"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter email address"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter full address"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Course *</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className="form-select"
                required
                disabled={isLoading}
              >
                <option value="">Select a course</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Medicine">Medicine</option>
                <option value="Law">Law</option>
                <option value="Arts & Humanities">Arts & Humanities</option>
                <option value="Science">Science</option>
                <option value="Education">Education</option>
                <option value="Economics">Economics</option>
                <option value="Psychology">Psychology</option>
              </select>
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select"
                required
                disabled={isLoading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
              </select>
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Semester *</label>
              <input
                type="number"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter semester (1-8)"
                min="1"
                max="8"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">GPA *</label>
              <input
                type="number"
                name="gpa"
                value={formData.gpa}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter GPA (0.0-4.0)"
                min="0.0"
                max="4.0"
                step="0.1"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>
          <motion.button 
            type="submit" 
            className="btn" 
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? <LoadingSpinner size={16} text="Enrolling..." /> : (
              <>
                <Plus size={16} />
                Enroll Student
              </>
            )}
          </motion.button>
        </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Students List */}
      <motion.div 
        ref={listRef}
        className="card"
        initial={{ opacity: 0, y: 50 }}
        animate={listInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}
          initial={{ opacity: 0, y: -20 }}
          animate={listInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="section-title" style={{ margin: 0 }}>
            <Users size={24} />
            Enrolled Students ({filteredStudents.length})
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button 
              onClick={exportData} 
              className="btn btn-secondary" 
              disabled={students.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              Export
            </motion.button>

          </div>
        </motion.div>

        {/* Search and Filter */}
        {students.length > 0 && (
          <motion.div 
            style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 20 }}
            animate={listInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  placeholder="Search by name, enrollment number, email, phone, or parent names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div style={{ minWidth: '200px' }}>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="form-select"
              >
                <option value="">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
        
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <LoadingSpinner size={48} text="Loading students..." />
            </motion.div>
          ) : filteredStudents.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              {students.length === 0 ? (
                <>
                  <h3>No students enrolled yet</h3>
                  <p>Start by adding a new student using the form above.</p>
                </>
              ) : (
                <>
                  <h3>No students found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              className="students-list-container"
              variants={containerVariants}
              initial="hidden"
              animate={listInView ? "visible" : "hidden"}
            >
              <div className="students-list-header">
                <div className="list-header-cell">Enrollment No</div>
                <div className="list-header-cell">Student Name</div>
                <div className="list-header-cell">Course</div>
                <div className="list-header-cell">Status</div>
                <div className="list-header-cell">Semester</div>
                <div className="list-header-cell">GPA</div>
                <div className="list-header-cell">Email</div>
                <div className="list-header-cell">Actions</div>
              </div>
              
              {currentStudents.map((student, index) => (
                <motion.div 
                  key={student.enrollmentNo} 
                  className="student-list-item"
                  variants={cardVariants}
                  initial="hidden"
                  animate={listInView ? "visible" : "hidden"}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="student-list-item-content">
                    <div className="list-cell">
                      <span className="cell-label">Enrollment No:</span>
                      <span className="cell-value">{student.enrollmentNo || 'N/A'}</span>
                    </div>
                    <div className="list-cell">
                      <span className="cell-label">Student Name:</span>
                      <span className="cell-value">{student.firstName || 'N/A'} {student.lastName || 'N/A'}</span>
                    </div>
                    <div className="list-cell">
                      <span className="cell-label">Course:</span>
                      <span className="cell-value">{student.course || 'N/A'}</span>
                    </div>
                    <div className="list-cell">
                      <span className="cell-label">Status:</span>
                      <span className="cell-value">{student.status || 'N/A'}</span>
                    </div>
                    <div className="list-cell">
                      <span className="cell-label">Semester:</span>
                      <span className="cell-value">{student.semester || 'N/A'}</span>
                    </div>
                    <div className="list-cell">
                      <span className="cell-label">GPA:</span>
                      <span className="cell-value">{student.gpa || 'N/A'}</span>
                    </div>
                    <div className="list-cell">
                      <span className="cell-label">Email:</span>
                      <span className="cell-value">{student.email || 'N/A'}</span>
                    </div>
                    <div className="list-cell actions-cell">
                      <motion.button
                        onClick={() => toggleStudentExpansion(student.enrollmentNo)}
                        className="btn btn-secondary btn-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {expandedStudents.has(student.enrollmentNo) ? (
                          <>
                            <ChevronUp size={14} />
                            <span>Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>More</span>
                          </>
                        )}
                      </motion.button>
                      {/*
                      <motion.button
                        onClick={() => editStudent(student)}
                        className="btn btn-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit size={14} />
                      </motion.button>
                      */}
                      <motion.button
                        onClick={() => viewStudentHistory(student)}
                        className="btn btn-secondary btn-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <History size={14} />
                        <span>History</span>
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedStudents.has(student.enrollmentNo) && (
                    <motion.div 
                      className="record-expanded-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="expanded-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Phone:</span>
                          <span className="detail-value">{student.phoneNo || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Father's Name:</span>
                          <span className="detail-value">{student.fathersName || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Mother's Name:</span>
                          <span className="detail-value">{student.mothersName || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date of Birth:</span>
                          <span className="detail-value">{student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Address:</span>
                          <span className="detail-value">{student.address || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Admission Date:</span>
                          <span className="detail-value">{student.admissionDate || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Created By:</span>
                          <span className="detail-value">{student.createdBy || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Created At:</span>
                          <span className="detail-value">{student.createdAt ? student.createdAt.slice(0, 10) : 'N/A'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            className="pagination-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={listInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button onClick={prevPage} disabled={currentStudentPage === 1}>Previous</button>
            <span>Page {currentStudentPage} of {totalPages}</span>
            <button onClick={nextPage} disabled={currentStudentPage === totalPages}>Next</button>
          </motion.div>
        )}
      </motion.div>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        student={selectedStudent}
        history={selectedStudent ? studentHistory : []}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSave={saveStudentChanges}
        isLoading={isEditLoading}
      />
        </>
      ) : (
        <AcademicRecords />
      )}
    </div>
  );
};

export default App; 