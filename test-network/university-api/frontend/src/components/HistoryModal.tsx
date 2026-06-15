import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, Edit, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Student, StudentHistory } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  history: StudentHistory[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, student, history }) => {
  if (!student) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus size={16} />;
      case 'updated':
        return <Edit size={16} />;
      case 'deleted':
        return <Trash2 size={16} />;
      case 'current':
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'var(--neon-green)';
      case 'updated':
        return 'var(--neon-blue)';
      case 'deleted':
        return 'var(--neon-red)';
      case 'current':
        return 'var(--text-secondary)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const isFieldChanged = (field: string, historyItem: StudentHistory) => {
    return historyItem.field === field && historyItem.action === 'updated';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="history-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <h2>Student History</h2>
                <div className="student-info-brief">
                  <span className="enrollment-number">{student.enrollmentNo}</span>
                  <span className="student-name">{student.firstName} {student.lastName}</span>
                </div>
              </div>
              <motion.button
                className="modal-close"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="modal-content">
              <div className="current-data-section">
                <h3>Current Data</h3>
                <div className="current-data-grid">
                  <div className="data-field">
                    <label>Student Name</label>
                    <span className="field-value">{student.firstName} {student.lastName}</span>
                  </div>
                  <div className="data-field">
                    <label>Email</label>
                    <span className="field-value">{student.email}</span>
                  </div>
                  <div className="data-field">
                    <label>Phone</label>
                    <span className="field-value">{student.phoneNo}</span>
                  </div>
                  <div className="data-field">
                    <label>Date of Birth</label>
                    <span className="field-value">{student.dateOfBirth}</span>
                  </div>
                  <div className="data-field">
                    <label>Address</label>
                    <span className="field-value">{student.address}</span>
                  </div>
                  <div className="data-field">
                    <label>Father's Name</label>
                    <span className="field-value">{student.fathersName}</span>
                  </div>
                  <div className="data-field">
                    <label>Mother's Name</label>
                    <span className="field-value">{student.mothersName}</span>
                  </div>
                  <div className="data-field">
                    <label>Course</label>
                    <span className="field-value">{student.course}</span>
                  </div>
                  <div className="data-field">
                    <label>Status</label>
                    <span className="field-value">{student.status}</span>
                  </div>
                  <div className="data-field">
                    <label>Semester</label>
                    <span className="field-value">{student.semester}</span>
                  </div>
                  <div className="data-field">
                    <label>GPA</label>
                    <span className="field-value">{student.gpa}</span>
                  </div>
                  <div className="data-field">
                    <label>Admission Date</label>
                    <span className="field-value">{student.admissionDate}</span>
                  </div>
                  <div className="data-field">
                    <label>Created By</label>
                    <span className="field-value">{student.createdBy}</span>
                  </div>
                  {student.updatedBy && (
                    <div className="data-field">
                      <label>Last Updated By</label>
                      <span className="field-value">{student.updatedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="history-section">
                <h3>Change History</h3>
                <div className="history-timeline">
                  {!Array.isArray(history) || history.length === 0 ? (
                    <div className="no-history">
                      <Clock size={48} />
                      <p>No changes recorded yet</p>
                    </div>
                  ) : (
                    history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="history-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="history-icon" style={{ color: getActionColor(item.action) }}>
                          {getActionIcon(item.action)}
                        </div>
                        <div className="history-content">
                          <div className="history-header">
                            <span className="history-action" style={{ color: getActionColor(item.action) }}>
                              {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                            </span>
                            <span className="history-date">{formatDate(item.changedAt)}</span>
                          </div>
                          <div className="history-description">{item.description}</div>
                          <div className="history-user">
                            <User size={14} />
                            {item.changedBy}
                          </div>
                          
                          {item.action === 'updated' && item.field && (
                            <div className="change-details">
                              <div className="change-field">
                                <span className="field-name">{item.field}:</span>
                                <div className="change-values">
                                  <span className="old-value">{item.oldValue || 'N/A'}</span>
                                  <ArrowRight size={12} />
                                  <span className="new-value">{item.newValue || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {item.action === 'current' && (
                            <div className="change-details">
                              <div className="change-field">
                                <span className="field-name">Current Record:</span>
                                <div className="change-values">
                                  <span className="new-value">Student data is current</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryModal; 