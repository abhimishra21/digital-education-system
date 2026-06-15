import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Edit, Plus, Trash2, ArrowRight } from 'lucide-react';
import { AcademicRecord, AcademicHistory } from '../types';

interface AcademicHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicRecord: AcademicRecord | null;
  history: AcademicHistory[];
}

const AcademicHistoryModal: React.FC<AcademicHistoryModalProps> = ({ isOpen, onClose, academicRecord, history }) => {
  if (!academicRecord) return null;

  const getActionIcon = (action?: string) => {
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

  const getActionColor = (action?: string) => {
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
                <h2>Semester Result History</h2>
                <div className="student-info-brief">
                  <span className="enrollment-number">{academicRecord.recordId}</span>
                  <span className="student-name">{academicRecord.examRollNumber} - {academicRecord.examination?.semester}</span>
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
                    <label>Record ID</label>
                    <span className="field-value">{academicRecord.recordId}</span>
                  </div>
                  <div className="data-field">
                    <label>Exam Roll</label>
                    <span className="field-value">{academicRecord.examRollNumber}</span>
                  </div>
                  <div className="data-field">
                    <label>Candidate</label>
                    <span className="field-value">{academicRecord.candidate?.name}</span>
                  </div>
                  <div className="data-field">
                    <label>University</label>
                    <span className="field-value">{academicRecord.university}</span>
                  </div>
                  <div className="data-field">
                    <label>Program</label>
                    <span className="field-value">{academicRecord.examination?.name}</span>
                  </div>
                  <div className="data-field">
                    <label>Semester</label>
                    <span className="field-value">{academicRecord.examination?.semester}</span>
                  </div>
                  <div className="data-field">
                    <label>Exam Type</label>
                    <span className="field-value">{academicRecord.examination?.examType}</span>
                  </div>
                  <div className="data-field">
                    <label>Capacity</label>
                    <span className="field-value">{academicRecord.examination?.capacity}</span>
                  </div>
                  <div className="data-field">
                    <label>Exam Month/Year</label>
                    <span className="field-value">{academicRecord.examination?.examMonthYear}</span>
                  </div>
                  <div className="data-field">
                    <label>Result</label>
                    <span className="field-value">{academicRecord.resultSummary?.result}</span>
                  </div>
                  <div className="data-field">
                    <label>Result Declared</label>
                    <span className="field-value">{formatDate(academicRecord.resultDates?.resultDeclaration)}</span>
                  </div>
                  <div className="data-field">
                    <label>Verified By</label>
                    <span className="field-value">{academicRecord.verification?.verifiedBy}</span>
                  </div>
                  {academicRecord.updatedBy && (
                    <div className="data-field">
                      <label>Last Updated By</label>
                      <span className="field-value">{academicRecord.updatedBy}</span>
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
                              {(item.action || 'update').charAt(0).toUpperCase() + (item.action || 'update').slice(1)}
                            </span>
                            <span className="history-time">{item.changedAt ? formatDate(item.changedAt) : 'N/A'}</span>
                          </div>
                          <div className="history-body">
                            {item.field ? (
                              <div className="field-change">
                                <span className="field-name">{item.field}</span>
                                <ArrowRight size={16} />
                                <span className="field-old" title={item.oldValue}>"{item.oldValue || ''}"</span>
                                <ArrowRight size={16} />
                                <span className="field-new" title={item.newValue}>"{item.newValue || ''}"</span>
                              </div>
                            ) : (
                              <div className="field-change">
                                <span className="field-name">{item.description || 'Record updated'}</span>
                              </div>
                            )}
                          </div>
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

export default AcademicHistoryModal; 