import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  BookOpen, 
  Plus, 
  Search,
  Download,
  History,
  Database,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AcademicRecord, AcademicFormData, Message, AcademicHistory } from '../types';
import { apiService } from '../services/api';
import { normalizeExternalSemesterResult } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Notification from './Notification';
import AcademicHistoryModal from './AcademicHistoryModal';

const AcademicRecords: React.FC = () => {
  const { user } = useAuth();
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [formData, setFormData] = useState<AcademicFormData>({
    rawJson: ''
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

  // State for history modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAcademicRecord, setSelectedAcademicRecord] = useState<AcademicRecord | null>(null);
  const [academicHistory, setAcademicHistory] = useState<AcademicHistory[]>([]);

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
        // Debug: Log the first record to see the structure
        if (response.data.length > 0) {
          console.log('First academic record in frontend:', response.data[0]);
          console.log('ResultHash in frontend:', response.data[0]?.resultHash);
          console.log('All available fields:', Object.keys(response.data[0]));
        }
        
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

  // When user types a numeric enrollment/roll number, fetch all semesters for that enrollment
  useEffect(() => {
    const run = async () => {
      try {
        const term = (searchTerm || '').trim();
        const looksLikeEnrollment = term.length >= 6 && /^\d+$/.test(term);
        if (!term) {
          // Reset to all records
          await loadAcademicRecords();
          return;
        }
        if (looksLikeEnrollment) {
          setIsLoading(true);
          const resp = await apiService.getAcademicRecordsByEnrollment(term);
          if (resp && Array.isArray(resp.data)) {
            setAcademicRecords(resp.data);
          }
        }
      } catch (e) {
        // Ignore and keep existing list
      } finally {
        setIsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Generate unique record ID
  const generateRecordId = useCallback((): string => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AR${year}${randomNum}`;
  }, []);

  // Handle form input changes
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const { value } = e.target;
    setFormData({ rawJson: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to perform this action' });
      return;
    }

    if (!formData.rawJson.trim()) {
      setMessage({ type: 'error', text: 'Please paste a valid semester result JSON' });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 3000);
      return;
    }

    setIsLoading(true);

    try {
      const parsed = JSON.parse(formData.rawJson);
      // Normalize external JSON into SemesterResult shape
      let normalized = normalizeExternalSemesterResult(parsed) as AcademicRecord;
      // Ensure local-only fields
      normalized = {
        ...normalized,
        id: Date.now(),
        recordId: normalized.recordId && normalized.recordId.trim().length > 0
          ? normalized.recordId
          : `${normalized.serialNumber || ''}-${normalized.examRollNumber || ''}` || generateRecordId(),
        createdAt: normalized.createdAt || new Date().toISOString(),
        createdBy: user?.name || normalized.createdBy || 'user'
      } as AcademicRecord;

      const apiResponse = await apiService.createAcademicRecord(normalized);
      
      if (apiResponse.success && apiResponse.data) {
        setAcademicRecords(prev => [apiResponse.data, ...prev]);
        setFormData({ rawJson: '' });
        setMessage({ 
          type: 'success', 
          text: `Semester result created successfully for ${normalized.examRollNumber}` 
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
        text: `Failed to create academic record: ${error instanceof Error ? error.message : 'Invalid JSON'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // View academic record history
  const viewAcademicHistory = async (academicRecord: AcademicRecord) => {
    try {
      setIsLoading(true);
      // Fetch history from blockchain API
      const response = await apiService.getAcademicRecordHistory(academicRecord.recordId);

      // Normalize history shape similar to student history API
      let normalizedHistory: AcademicHistory[] = [];
      const data: any = response?.data;
      if (Array.isArray(data)) {
        normalizedHistory = data as AcademicHistory[];
      } else if (data && Array.isArray((data as any).history)) {
        normalizedHistory = (data as any).history as AcademicHistory[];
      } else if (data && typeof data === 'object') {
        // Some APIs may return an object per change; wrap it
        normalizedHistory = [data as AcademicHistory];
      }

      setAcademicHistory(normalizedHistory);
      setSelectedAcademicRecord(academicRecord);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch academic record history:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to fetch academic record history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Test QR decryption functionality
  const testQRDecryption = async () => {
    try {
      setIsLoading(true);
      
      // Test with the provided encrypted data
      const testEncryptedData = "wAPbnX7vhHfcNuxo6nxUwhLOGEqHb9aDhx5uUCibqT0CtfoAhUieNizG%2F31dQq9qvZaaHkcIfvth4beoAmP1kt7d%2F5RizZmdbzNFo%2FfRv%2BnRgjck7Yap8RtIwgwiNcZJBFF0cB5XcSNFwqx%2BSU4W2RMb8hvgH8Z9OKJOOsGN7g%2FuPXl4ZyuRsFP2buVgS5FWCH6EKunB1jC5IAURXL5IlEl3d%2F4F5pUIFHjfE2uQMglPnLh1%2FXJPJZJeyfeQHbk2";
      
      const response = await apiService.decryptQRFromURL(testEncryptedData);
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `QR Decryption successful! Found ${response.data.allSemesters.length} semester(s) for enrollment ${response.data.data.examRollNumber}. Source: ${response.data.source}` 
        });
        
        // Update the records list with the decrypted data
        setAcademicRecords(response.data.allSemesters);
        
        // Log the decrypted QR data for debugging
        console.log('Decrypted QR Data:', response.data.qrData);
        
        setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
      }
    } catch (error) {
      console.error('QR Decryption test failed:', error);
      setMessage({ 
        type: 'error', 
        text: `QR Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage({ type: 'success', text: '' }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search academic records
  const filteredRecords = academicRecords.filter(record => {
    try {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        (record.recordId && record.recordId.toLowerCase().includes(searchLower)) ||
        (record.examRollNumber && record.examRollNumber.toLowerCase().includes(searchLower)) ||
        (record.candidate?.name && record.candidate.name.toLowerCase().includes(searchLower)) ||
        (record.examination?.name && record.examination.name.toLowerCase().includes(searchLower)) ||
        (record.examination?.semester && record.examination.semester.toLowerCase().includes(searchLower));
      
      const matchesFilter = !filterLevel || (record.examination?.semester && record.examination.semester === filterLevel);
      return matchesSearch && matchesFilter;
    } catch (error) {
      console.error('Error filtering academic record:', record, error);
      return false;
    }
  });

  // Get unique semesters for filter
  const uniqueLevels = [...new Set(academicRecords.map(record => record.examination?.semester).filter(Boolean))] as string[];

  // Calculate statistics
  const totalRecords = academicRecords.length;
  const levelStats = academicRecords.reduce((acc, record) => {
    const key = record.examination?.semester || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonLevel = Object.keys(levelStats).reduce((a, b) => 
    (levelStats[a] || 0) > (levelStats[b] || 0) ? a : b, '');

  // Export data
  const exportData = (): void => {
    const dataStr = JSON.stringify(academicRecords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'semester-results.json';
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
          Semester Results Management
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          Blockchain based semester-result management by Expedien Esolutions.
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
            <div className="stat-label">Semesters</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <div className="stat-number">{mostCommonLevel}</div>
            <div className="stat-label">Most Common Semester</div>
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
              New Semester Result (paste JSON)
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
            className="grid"
            variants={containerVariants}
            initial="hidden"
            animate={formInView ? "visible" : "hidden"}
          >
            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Semester Result JSON *</label>
              <textarea
                name="rawJson"
                value={formData.rawJson}
                onChange={handleJsonChange}
                className="form-input"
                placeholder="Paste JSON here"
                rows={12}
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
                Create Semester Result
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
            Semester Results ({filteredRecords.length})
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
            <motion.button 
              onClick={testQRDecryption} 
              className="btn btn-secondary" 
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔐 Test QR Decryption
            </motion.button>
          </div>
        </motion.div>

        {/* PDF Identification Info */}
        {academicRecords.length > 0 && (
          <motion.div 
            className="info-box"
            style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.05)', 
              border: '1px solid rgba(59, 130, 246, 0.2)', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '24px',
              fontSize: '14px'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={listInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <strong>📋 PDF Identification:</strong> Each marksheet is now identified using multiple parameters (Cycle, Exam Month/Year, Exam Type, Result Hash) to ensure accurate PDF generation even when multiple marksheets exist for the same enrollment number. The Result Hash comes directly from the blockchain API for unique identification. Records without a Result Hash cannot generate PDFs.
          </motion.div>
        )}

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
                  placeholder="Search by record ID, exam roll, candidate, or program..."
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
                <option value="">All Semesters</option>
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
              <LoadingSpinner size={48} text="Loading semester results..." />
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
                  <h3>No semester results found</h3>
                  <p>Start by adding a new result using the form above.</p>
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
                  <div className="list-header-cell">Exam Roll</div>
                  <div className="list-header-cell">Candidate</div>
                  <div className="list-header-cell">Program</div>
                  <div className="list-header-cell">Semester</div>
                  <div className="list-header-cell">Result</div>
                  <div className="list-header-cell">Hash Status</div>
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
                        <span className="cell-label">Exam Roll:</span>
                        <span className="cell-value">{record.examRollNumber || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Candidate:</span>
                        <span className="cell-value">{record.candidate?.name || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Program:</span>
                        <span className="cell-value">{record.examination?.name || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Semester:</span>
                        <span className="cell-value">{record.examination?.semester || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Result:</span>
                        <span className="cell-value">{record.resultSummary?.result || 'N/A'}</span>
                      </div>
                      <div className="list-cell">
                        <span className="cell-label">Hash Status:</span>
                        <span className="cell-value" style={{
                          color: record.resultHash ? '#10b981' : '#ef4444',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {record.resultHash ? '✓ Available' : '✗ Missing'}
                        </span>
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
                          onClick={() => viewAcademicHistory(record)}
                          className="btn btn-primary btn-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <History size={14} />
                          <span>History</span>
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            try {
                              localStorage.setItem('pdfRecord', JSON.stringify(record));
                            } catch {}
                            
                            // Build URL with multiple parameters for better identification
                            const params = new URLSearchParams();
                            params.append('enrollmentNo', record.examRollNumber || '');
                            params.append('cycle', record.examination?.semester || '');
                            params.append('examMonth', record.examination?.examMonthYear?.split(' ')[0] || '');
                            params.append('examYear', record.examination?.examMonthYear?.split(' ')[1] || '');
                            params.append('examType', record.examination?.examType || '');
                            
                            // Use ONLY the resultHash from the API for unique identification
                            if (record.resultHash) {
                              params.append('resultHash', record.resultHash);
                            }
                            
                            const url = `/result.html?${params.toString()}`;
                            window.open(url, '_blank');
                          }}
                          className={`btn btn-sm ${record.resultHash ? 'btn-secondary' : 'btn-secondary'}`}
                          style={!record.resultHash ? { 
                            opacity: 0.5, 
                            cursor: 'not-allowed',
                            backgroundColor: '#ccc',
                            color: '#666'
                          } : {}}
                          disabled={!record.resultHash}
                          whileHover={record.resultHash ? { scale: 1.05 } : {}}
                          whileTap={record.resultHash ? { scale: 0.95 } : {}}
                          title={record.resultHash 
                            ? `PDF Parameters: Cycle: ${record.examination?.semester || 'N/A'}, Exam: ${record.examination?.examType || 'N/A'}, Hash: ${record.resultHash}`
                            : 'Result Hash not available - PDF cannot be generated'
                          }
                        >
                          <Download size={14} />
                          <span>{record.resultHash ? 'View PDF' : 'No Hash'}</span>
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
                            <span className="detail-label">Serial Number:</span>
                            <span className="detail-value">{record.serialNumber || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Exam Type/Capacity:</span>
                            <span className="detail-value">{`${record.examination?.examType || 'N/A'} / ${record.examination?.capacity || 'N/A'}`}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">College/Center:</span>
                            <span className="detail-value">{`${record.examination?.collegeName || 'N/A'} / ${record.examination?.examCenterName || 'N/A'}`}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Exam Month/Year:</span>
                            <span className="detail-value">{record.examination?.examMonthYear || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Result Hash:</span>
                            <span className="detail-value" style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '12px', 
                              wordBreak: 'break-all',
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}>
                              {record.resultHash || 'Not Available'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">PDF Parameters:</span>
                            <span className="detail-value">
                              {`${record.examination?.semester || 'N/A'} | ${record.examination?.examType || 'N/A'} | ${record.resultHash ? 'Hash Available' : 'Hash Missing'}`}
                            </span>
                          </div>
                        </div>

                        {/* Marks table */}
                        {Array.isArray(record.marksDetails) && record.marksDetails.length > 0 && (
                          <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Paper Code</th>
                                  <th>Paper Name</th>
                                  <th>Category</th>
                                  <th>TH</th>
                                  <th>IA</th>
                                  <th>PR</th>
                                  <th>GR</th>
                                  <th>Total</th>
                                  <th>MPM</th>
                                  <th>MM</th>
                                </tr>
                              </thead>
                              <tbody>
                                {record.marksDetails.map((md) => (
                                  <tr key={`${record.recordId}-${md.sNo}`}>
                                    <td>{md.sNo}</td>
                                    <td>{md.paperCode}</td>
                                    <td>{md.paperName}</td>
                                    <td>{md.category}</td>
                                    <td>{md.marksObtained?.TH ?? '-'}</td>
                                    <td>{md.marksObtained?.IA ?? '-'}</td>
                                    <td>{md.marksObtained?.PR ?? '-'}</td>
                                    <td>{md.marksObtained?.GR ?? '-'}</td>
                                    <td>{md.marksObtained?.TOTAL ?? '-'}</td>
                                    <td>{md.minimumPassingMarks}</td>
                                    <td>{md.maximumMarks}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
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

      {/* Academic History Modal */}
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        academicRecord={selectedAcademicRecord}
        history={selectedAcademicRecord ? academicHistory : []}
      />
    </div>
  );
};

export default AcademicRecords; 