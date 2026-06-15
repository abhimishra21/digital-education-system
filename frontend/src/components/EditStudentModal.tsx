import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, BookOpen, Users, Calendar, Phone, Mail, MapPin, Activity, GraduationCap, Star } from 'lucide-react';
import { FormData } from '../types';
import { Student } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (enrollmentNo: string, updatedData: FormData, changes: Record<string, { old: string; new: string }>) => void;
  isLoading: boolean;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  onSave, 
  isLoading 
}) => {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        fathersName: student.fathersName,
        mothersName: student.mothersName,
        dateOfBirth: student.dateOfBirth,
        phoneNo: student.phoneNo,
        email: student.email,
        address: student.address,
        course: student.course,
        status: student.status,
        semester: student.semester,
        gpa: student.gpa
      });
      setErrors({});
    }
  }, [student]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.fathersName.trim()) {
      newErrors.fathersName = "Father's name is required";
    }
    if (!formData.mothersName.trim()) {
      newErrors.mothersName = "Mother's name is required";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.phoneNo.trim()) {
      newErrors.phoneNo = 'Phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.course) {
      newErrors.course = 'Course selection is required';
    }
    if (formData.semester < 1 || formData.semester > 8) {
      newErrors.semester = 'Semester must be between 1 and 8';
    }
    if (formData.gpa < 0 || formData.gpa > 4) {
      newErrors.gpa = 'GPA must be between 0 and 4';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student || !validateForm()) {
      return;
    }

    // Calculate changes
    const changes: Record<string, { old: string; new: string }> = {};
    
    if (student.firstName !== formData.firstName) {
      changes.firstName = { old: student.firstName, new: formData.firstName };
    }
    if (student.lastName !== formData.lastName) {
      changes.lastName = { old: student.lastName, new: formData.lastName };
    }
    if (student.fathersName !== formData.fathersName) {
      changes.fathersName = { old: student.fathersName, new: formData.fathersName };
    }
    if (student.mothersName !== formData.mothersName) {
      changes.mothersName = { old: student.mothersName, new: formData.mothersName };
    }
    if (student.dateOfBirth !== formData.dateOfBirth) {
      changes.dateOfBirth = { old: student.dateOfBirth, new: formData.dateOfBirth };
    }
    if (student.phoneNo !== formData.phoneNo) {
      changes.phoneNo = { old: student.phoneNo, new: formData.phoneNo };
    }
    if (student.email !== formData.email) {
      changes.email = { old: student.email, new: formData.email };
    }
    if (student.address !== formData.address) {
      changes.address = { old: student.address, new: formData.address };
    }
    if (student.course !== formData.course) {
      changes.course = { old: student.course, new: formData.course };
    }
    if (student.status !== formData.status) {
      changes.status = { old: student.status, new: formData.status };
    }
    if (student.semester !== formData.semester) {
      changes.semester = { old: student.semester.toString(), new: formData.semester.toString() };
    }
    if (student.gpa !== formData.gpa) {
      changes.gpa = { old: student.gpa.toString(), new: formData.gpa.toString() };
    }

    // Only save if there are changes
    if (Object.keys(changes).length > 0) {
      onSave(student.enrollmentNo, formData, changes);
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  if (!student) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
        >
          <motion.div
            className="edit-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <h2>Edit Student</h2>
                <div className="student-info-brief">
                  <span className="enrollment-number">{student.enrollmentNo}</span>
                  <span className="student-name">{student.firstName} {student.lastName}</span>
                </div>
              </div>
              <motion.button
                className="modal-close"
                onClick={handleCancel}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.firstName ? 'error' : ''}`}
                    placeholder="Enter first name"
                    required
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <span className="error-text">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.lastName ? 'error' : ''}`}
                    placeholder="Enter last name"
                    required
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <span className="error-text">{errors.lastName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Users size={16} />
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    name="fathersName"
                    value={formData.fathersName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.fathersName ? 'error' : ''}`}
                    placeholder="Enter father's full name"
                    required
                    disabled={isLoading}
                  />
                  {errors.fathersName && (
                    <span className="error-text">{errors.fathersName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Users size={16} />
                    Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="mothersName"
                    value={formData.mothersName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.mothersName ? 'error' : ''}`}
                    placeholder="Enter mother's full name"
                    required
                    disabled={isLoading}
                  />
                  {errors.mothersName && (
                    <span className="error-text">{errors.mothersName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={16} />
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
                    required
                    disabled={isLoading}
                  />
                  {errors.dateOfBirth && (
                    <span className="error-text">{errors.dateOfBirth}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={16} />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNo"
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                    className={`form-input ${errors.phoneNo ? 'error' : ''}`}
                    placeholder="Enter phone number"
                    required
                    disabled={isLoading}
                  />
                  {errors.phoneNo && (
                    <span className="error-text">{errors.phoneNo}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                    required
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={16} />
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`form-input ${errors.address ? 'error' : ''}`}
                    placeholder="Enter full address"
                    required
                    disabled={isLoading}
                  />
                  {errors.address && (
                    <span className="error-text">{errors.address}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <BookOpen size={16} />
                    Course *
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className={`form-select ${errors.course ? 'error' : ''}`}
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
                  {errors.course && (
                    <span className="error-text">{errors.course}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Activity size={16} />
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`form-select ${errors.status ? 'error' : ''}`}
                    required
                    disabled={isLoading}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  {errors.status && (
                    <span className="error-text">{errors.status}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <GraduationCap size={16} />
                    Semester *
                  </label>
                  <input
                    type="number"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className={`form-input ${errors.semester ? 'error' : ''}`}
                    placeholder="Enter semester (1-8)"
                    min="1"
                    max="8"
                    required
                    disabled={isLoading}
                  />
                  {errors.semester && (
                    <span className="error-text">{errors.semester}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Star size={16} />
                    GPA *
                  </label>
                  <input
                    type="number"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    className={`form-input ${errors.gpa ? 'error' : ''}`}
                    placeholder="Enter GPA (0.0-4.0)"
                    min="0.0"
                    max="4.0"
                    step="0.1"
                    required
                    disabled={isLoading}
                  />
                  {errors.gpa && (
                    <span className="error-text">{errors.gpa}</span>
                  )}
                </div>
              </div>

              <div className="current-info">
                <h4>Current Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Enrollment Number:</span>
                    <span className="info-value">{student.enrollmentNo}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Admission Date:</span>
                    <span className="info-value">{student.admissionDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created By:</span>
                    <span className="info-value">{student.createdBy || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <motion.button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="btn"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <LoadingSpinner size={16} text="Saving..." />
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditStudentModal; 