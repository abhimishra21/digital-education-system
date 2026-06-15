import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Trash2, 
  Search,
  Download,
  RefreshCw,
  History,
  Edit,
  Database,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AcademicRecord, AcademicFormData, Message } from '../types';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Notification from './Notification';

const AcademicRecords: React.FC = () => {
  const { user } = useAuth();
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [formData, setFormData] = useState<AcademicFormData>({
    recordId: '',
    enrollmentNo: '',
    educationLevel: '',
    schoolOrCollegeName: '',
    boardOrUniversityName: '',
    institutionAddress: '',
    institutionCode: '',
    startYear: '',
    endYear: '',
    passingYear: '',
    stream: '',
    majorSubjects: '',
    optionalSubjects: '',
    percentage: '',
    grade: ''
  });
  const [message, setMessage] = useState<Message>({ type: 'success', text: '' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(6);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Intersection Observer for animations
  const [headerRef, headerInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [formRef, formInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [listRef, listInView] = useInView({ threshold: 0.1, triggerOnce: true });

  // Load academic records from API
  const loadAcademicRecords = async () => {
    try {
      setIsLoading(true);
      
      // Check academic records API health
      try {
        const healthResponse = await apiService.getAcademicHealth();
        setIsApiConnected(true);
        console.log('Academic Records API Health:', healthResponse);
      } catch (error) {
        console.error('Academic Records API health check failed:', error);
        setIsApiConnected(false);
        setMessage({ type: 'error', text: 'Academic Records API is not available. Please ensure the academic records API server is running on port 3002.' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
        return;
      }
      
      // Load academic records from the blockchain API
      const response = await apiService.getAllAcademicRecords();
      console.log('Academic Records API Response:', response);
      
      if (response.success && response.data) {
        setAcademicRecords(response.data);
        setMessage({ type: 'success', text: `Loaded ${response.data.length} academic records successfully!` });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load academic records' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Failed to load academic records:', error);
      setIsApiConnected(false);
      setMessage({ type: 'error', text: 'Failed to load academic records. Please check if the academic records API server is running on port 3002.' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicRecords();
  }, []);

  // Generate unique record ID
  const generateRecordId = useCallback((): string => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AR${year}${randomNum}`;
  }, []);

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

    // Validate form
    if (!formData.enrollmentNo || !formData.educationLevel || !formData.schoolOrCollegeName || 
        !formData.boardOrUniversityName || !formData.institutionAddress || !formData.startYear || 
        !formData.endYear || !formData.passingYear || !formData.stream || !formData.majorSubjects || 
        !formData.percentage || !formData.grade) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
      return;
    }

    setIsLoading(true);

    try {
      // Create new academic record data
      const newAcademicRecord: AcademicRecord = {
        id: Date.now(),
        recordId: generateRecordId(),
        enrollmentNo: formData.enrollmentNo,
        educationLevel: formData.educationLevel,
        schoolOrCollegeName: formData.schoolOrCollegeName,
        boardOrUniversityName: formData.boardOrUniversityName,
        institutionAddress: formData.institutionAddress,
        institutionCode: formData.institutionCode,
        startYear: formData.startYear,
        endYear: formData.endYear,
        passingYear: formData.passingYear,
        stream: formData.stream,
        majorSubjects: formData.majorSubjects,
        optionalSubjects: formData.optionalSubjects,
        percentage: formData.percentage,
        grade: formData.grade,
        createdBy: user.name,
        createdAt: new Date().toISOString()
      };

      // Create academic record in the blockchain
      const apiResponse = await apiService.createAcademicRecord(newAcademicRecord);
      
      if (apiResponse.success && apiResponse.data) {
        // Add record to local state
        setAcademicRecords(prev => [apiResponse.data, ...prev]);
        
        // Reset form
        setFormData({
          recordId: '',
          enrollmentNo: '',
          educationLevel: '',
          schoolOrCollegeName: '',
          boardOrUniversityName: '',
          institutionAddress: '',
          institutionCode: '',
          startYear: '',
          endYear: '',
          passingYear: '',
          stream: '',
          majorSubjects: '',
          optionalSubjects: '',
          percentage: '',
          grade: ''
        });

        // Show success message
        setMessage({ 
          type: 'success', 
          text: `Academic record for ${formData.enrollmentNo} created successfully! Record ID: ${newAcademicRecord.recordId}` 
        });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      } else {
        setMessage({ type: 'error', text: apiResponse.message || 'Failed to create academic record' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Failed to create academic record:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to create academic record: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete academic record
  const deleteAcademicRecord = useCallback(async (recordId: string): Promise<void> => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to perform this action' });
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete academic record from the blockchain
      const apiResponse = await apiService.deleteAcademicRecord(recordId);
      
      if (apiResponse.success) {
        // Remove from local state
        setAcademicRecords(prev => prev.filter(record => record.recordId !== recordId));
        
        setMessage({ type: 'success', text: 'Academic record removed successfully' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: apiResponse.message || 'Failed to delete academic record' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Failed to delete academic record:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to delete academic record: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initialize academic records ledger
  const initializeAcademicLedger = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiService.initAcademicLedger();
      setMessage({ type: 'success', text: 'Academic Records Blockchain ledger initialized with sample data!' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
      
      // Reload academic records after initialization
      const response = await apiService.getAllAcademicRecords();
      if (response.success && response.data) {
        setAcademicRecords(response.data);
        setIsApiConnected(true);
      } else {
        setMessage({ type: 'error', text: 'Failed to load academic records after initialization' });
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Failed to initialize academic records ledger:', error);
      setMessage({ type: 'error', text: 'Failed to initialize academic records blockchain ledger' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter and search academic records
  const filteredRecords = academicRecords.filter(record => {
    try {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        (record.recordId && record.recordId.toLowerCase().includes(searchLower)) ||
        (record.enrollmentNo && record.enrollmentNo.toLowerCase().includes(searchLower)) ||
        (record.schoolOrCollegeName && record.schoolOrCollegeName.toLowerCase().includes(searchLower)) ||
        (record.boardOrUniversityName && record.boardOrUniversityName.toLowerCase().includes(searchLower)) ||
        (record.stream && record.stream.toLowerCase().includes(searchLower)) ||
        (record.majorSubjects && record.majorSubjects.toLowerCase().includes(searchLower));
      
      const matchesFilter = !filterLevel || (record.educationLevel && record.educationLevel === filterLevel);
      return matchesSearch && matchesFilter;
    } catch (error) {
      console.error('Error filtering academic record:', record, error);
      return false;
    }
  });

  // Get unique education levels for filter
  const uniqueLevels = [...new Set(academicRecords.map(record => record.educationLevel))];

  // Calculate statistics
  const totalRecords = academicRecords.length;
  const levelStats = academicRecords.reduce((acc, record) => {
    acc[record.educationLevel] = (acc[record.educationLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonLevel = Object.keys(levelStats).reduce((a, b) => 
    levelStats[a] > levelStats[b] ? a : b, '');

  // Export data
  const exportData = (): void => {
    const dataStr = JSON.stringify(academicRecords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'academic-records.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Toggle record expansion
  const toggleRecordExpansion = (recordId: string) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  // Pagination handlers
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setExpandedRecords(new Set());
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
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

  return (
    <div className="container">
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
          <BookOpen size={48} style={{ display: 'inline', marginRight: '16px' }} />
          Academic Records Management
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          Blockchain based academic records management system
        </motion.p>
        
        {/* API Connection Status */}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
              <motion.button
                className="init-ledger-btn"
                onClick={initializeAcademicLedger}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Initialize Academic Records Ledger
              </motion.button>
              <motion.button
                className="btn btn-secondary"
                onClick={loadAcademicRecords}
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
      {totalRecords > 0 && (
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
            <div className="stat-number">{totalRecords}</div>
            <div className="stat-label">Total Records</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{uniqueLevels.length}</div>
            <div className="stat-label">Education Levels</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{mostCommonLevel}</div>
            <div className="stat-label">Most Common Level</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{new Date().getFullYear()}</div>
            <div className="stat-label">Current Year</div>
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

      {/* Academic Record Form Accordion */}
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
              New Academic Record
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
              <label className="form-label">Enrollment Number *</label>
              <input
                type="text"
                name="enrollmentNo"
                value={formData.enrollmentNo}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter enrollment number"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Education Level *</label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                className="form-select"
                required
                disabled={isLoading}
              >
                <option value="">Select education level</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
                <option value="Certificate">Certificate</option>
              </select>
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">School/College Name *</label>
              <input
                type="text"
                name="schoolOrCollegeName"
                value={formData.schoolOrCollegeName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter school or college name"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Board/University Name *</label>
              <input
                type="text"
                name="boardOrUniversityName"
                value={formData.boardOrUniversityName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter board or university name"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Institution Address *</label>
              <input
                type="text"
                name="institutionAddress"
                value={formData.institutionAddress}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter institution address"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Institution Code</label>
              <input
                type="text"
                name="institutionCode"
                value={formData.institutionCode}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter institution code"
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Start Year *</label>
              <input
                type="number"
                name="startYear"
                value={formData.startYear}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter start year"
                min="1900"
                max={new Date().getFullYear()}
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">End Year *</label>
              <input
                type="number"
                name="endYear"
                value={formData.endYear}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter end year"
                min="1900"
                max={new Date().getFullYear()}
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Passing Year *</label>
              <input
                type="number"
                name="passingYear"
                value={formData.passingYear}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter passing year"
                min="1900"
                max={new Date().getFullYear()}
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Stream *</label>
              <input
                type="text"
                name="stream"
                value={formData.stream}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter stream (e.g., Science, Arts, Commerce)"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Major Subjects *</label>
              <input
                type="text"
                name="majorSubjects"
                value={formData.majorSubjects}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter major subjects (comma separated)"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Optional Subjects</label>
              <input
                type="text"
                name="optionalSubjects"
                value={formData.optionalSubjects}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter optional subjects (comma separated)"
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Percentage *</label>
              <input
                type="number"
                name="percentage"
                value={formData.percentage}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter percentage"
                min="0"
                max="100"
                step="0.1"
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Grade *</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter grade (e.g., A, B, C)"
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
            {isLoading ? <LoadingSpinner size={16} text="Creating..." /> : (
              <>
                <Plus size={16} />
                Create Academic Record
              </>
            )}
          </motion.button>
        </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Academic Records List */}
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
            <BookOpen size={24} />
            Academic Records ({filteredRecords.length})
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button 
              onClick={exportData} 
              className="btn btn-secondary" 
              disabled={academicRecords.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        {academicRecords.length > 0 && (
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
                  placeholder="Search by record ID, enrollment number, institution, or subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div style={{ minWidth: '200px' }}>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="form-select"
              >
                <option value="">All Levels</option>
                {uniqueLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
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
              <LoadingSpinner size={48} text="Loading academic records..." />
            </motion.div>
          ) : filteredRecords.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              {academicRecords.length === 0 ? (
                <>
                  <h3>No academic records found</h3>
                  <p>Start by adding a new academic record using the form above.</p>
                </>
              ) : (
                <>
                  <h3>No records found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </>
              )}
            </motion.div>
                      ) : (
              <motion.div 
                className="records-list-container"
                variants={containerVariants}
                initial="hidden"
                animate={listInView ? "visible" : "hidden"}
              >
                <div className="records-list-header">
                  <div className="list-header-cell">Record ID</div>
                  <div className="list-header-cell">Enrollment No</div>
                  <div className="list-header-cell">Education Level</div>
                  <div className="list-header-cell">Institution</div>
                  <div className="list-header-cell">Stream</div>
                  <div className="list-header-cell">Percentage</div>
                  <div className="list-header-cell">Grade</div>
                  <div className="list-header-cell">Actions</div>
                </div>
                
                {currentRecords.map((record, index) => (
                  <motion.div 
                    key={record.id} 
                    className="record-list-item"
                    variants={cardVariants}
                    initial="hidden"
                    animate={listInView ? "visible" : "hidden"}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="list-item-content">
                      <div className="list-cell">
                        <span className="cell-label">Record ID:</span>
                        <span className="cell-value">{record.recordId || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Enrollment No:</span>
                        <span className="cell-value">{record.enrollmentNo || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Education Level:</span>
                        <span className="cell-value">{record.educationLevel || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Institution:</span>
                        <span className="cell-value">{record.schoolOrCollegeName || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Stream:</span>
                        <span className="cell-value">{record.stream || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Percentage:</span>
                        <span className="cell-value">{record.percentage}%</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Grade:</span>
                        <span className="cell-value">{record.grade || 'N/A'}</span>
                      </div>
                      <div className="list-cell actions-cell">
                        <motion.button
                          onClick={() => toggleRecordExpansion(record.recordId)}
                          className="btn btn-secondary btn-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {expandedRecords.has(record.recordId) ? (
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
                        <motion.button
                          onClick={() => deleteAcademicRecord(record.recordId)}
                          className="btn btn-danger btn-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedRecords.has(record.recordId) && (
                      <motion.div 
                        className="record-expanded-details"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="expanded-details-grid">
                          <div className="detail-item">
                            <span className="detail-label">Board/University:</span>
                            <span className="detail-value">{record.boardOrUniversityName || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Institution Address:</span>
                            <span className="detail-value">{record.institutionAddress || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Institution Code:</span>
                            <span className="detail-value">{record.institutionCode || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{record.startYear} - {record.endYear}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Passing Year:</span>
                            <span className="detail-value">{record.passingYear || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Major Subjects:</span>
                            <span className="detail-value">{record.majorSubjects || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Optional Subjects:</span>
                            <span className="detail-value">{record.optionalSubjects || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Created By:</span>
                            <span className="detail-value">{record.createdBy || 'N/A'}</span>
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
            <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AcademicRecords; 