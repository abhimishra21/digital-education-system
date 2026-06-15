import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Users, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: 'students' | 'academic';
  onPageChange: (page: 'students' | 'academic') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handlePageChange = (page: 'students' | 'academic') => {
    onPageChange(page);
    setIsDropdownOpen(false);
  };

  return (
    <div className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <h2 className="nav-title">
            {currentPage === 'students' ? 'Student Records' : 'Academic Records'}
          </h2>
        </div>
        
        <div className="nav-right">
          {/* Page Selection Dropdown */}
          <div className="dropdown-container">
            <motion.button
              className="dropdown-trigger"
              onClick={toggleDropdown}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>
                {currentPage === 'students' ? (
                  <>
                    <Users size={16} />
                    Student Records
                  </>
                ) : (
                  <>
                    <BookOpen size={16} />
                    Academic Records
                  </>
                )}
              </span>
              {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </motion.button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    className={`dropdown-item ${currentPage === 'students' ? 'active' : ''}`}
                    onClick={() => handlePageChange('students')}
                    whileHover={{ backgroundColor: 'var(--primary-light)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Users size={16} />
                    <span>Student Records</span>
                  </motion.button>
                  
                  <motion.button
                    className={`dropdown-item ${currentPage === 'academic' ? 'active' : ''}`}
                    onClick={() => handlePageChange('academic')}
                    whileHover={{ backgroundColor: 'var(--primary-light)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BookOpen size={16} />
                    <span>Academic Records</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Info */}
          <div className="user-info">
            <div className="user-avatar">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <motion.button
              className="logout-btn"
              onClick={logout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 