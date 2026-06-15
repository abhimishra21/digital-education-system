import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  Trash2, 
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';

function App() {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    fathersName: '',
    mothersName: '',
    course: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load students from localStorage on component mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('universityStudents');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
  }, []);

  // Save students to localStorage whenever students state changes
  useEffect(() => {
    localStorage.setItem('universityStudents', JSON.stringify(students));
  }, [students]);

  // Generate unique enrollment number
  const generateEnrollmentNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EN${year}${randomNum}`;
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.studentName || !formData.fathersName || !formData.mothersName || !formData.course) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Create new student
    const newStudent = {
      id: Date.now(),
      enrollmentNumber: generateEnrollmentNumber(),
      ...formData,
      enrollmentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Add student to list
    setStudents(prev => [newStudent, ...prev]);
    
    // Reset form
    setFormData({
      studentName: '',
      fathersName: '',
      mothersName: '',
      course: ''
    });

    setIsLoading(false);

    // Show success message
    setMessage({ 
      type: 'success', 
      text: `Student ${formData.studentName} enrolled successfully with ID: ${newStudent.enrollmentNumber}` 
    });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Delete student
  const deleteStudent = useCallback((id) => {
    setStudents(prev => prev.filter(student => student.id !== id));
    setMessage({ type: 'success', text: 'Student removed successfully' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  // Filter and search students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterCourse || student.course === filterCourse;
    return matchesSearch && matchesFilter;
  });

  // Get unique courses for filter
  const uniqueCourses = [...new Set(students.map(student => student.course))];

  // Calculate statistics
  const totalStudents = students.length;
  const courseStats = students.reduce((acc, student) => {
    acc[student.course] = (acc[student.course] || 0) + 1;
    return acc;
  }, {});
  const mostPopularCourse = Object.keys(courseStats).reduce((a, b) => 
    courseStats[a] > courseStats[b] ? a : b, '');

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(students, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'university-students.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all student data? This action cannot be undone.')) {
      setStudents([]);
      localStorage.removeItem('universityStudents');
      setMessage({ type: 'success', text: 'All data cleared successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>
          <GraduationCap size={48} style={{ display: 'inline', marginRight: '16px' }} />
          University Admission Portal
        </h1>
        <p>Streamlined student enrollment management with modern interface</p>
      </div>

      {/* Statistics Dashboard */}
      {totalStudents > 0 && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{uniqueCourses.length}</div>
            <div className="stat-label">Active Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mostPopularCourse}</div>
            <div className="stat-label">Most Popular Course</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{new Date().getFullYear()}</div>
            <div className="stat-label">Academic Year</div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <Notification
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: '', text: '' })}
        />
      )}

      {/* Admission Form */}
      <div className="card">
        <h2 className="section-title">
          <Plus size={24} />
          New Student Admission
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Student Name *</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter student's full name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
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
            </div>
            <div className="form-group">
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
            </div>
            <div className="form-group">
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
            </div>
          </div>
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={16} text="Enrolling..." /> : (
              <>
                <Plus size={16} />
                Enroll Student
              </>
            )}
          </button>
        </form>
      </div>

      {/* Students List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <Users size={24} />
            Enrolled Students ({filteredStudents.length})
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={exportData} className="btn btn-secondary" disabled={students.length === 0}>
              <Download size={16} />
              Export
            </button>
            <button onClick={clearAllData} className="btn btn-danger" disabled={students.length === 0}>
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        {students.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  placeholder="Search by name or enrollment number..."
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
          </div>
        )}
        
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
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
          </div>
        ) : (
          <div className="grid grid-2">
            {filteredStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="enrollment-number">
                  {student.enrollmentNumber}
                </div>
                <div className="student-info">
                  <strong>Student:</strong>
                  <span>{student.studentName}</span>
                </div>
                <div className="student-info">
                  <strong>Father:</strong>
                  <span>{student.fathersName}</span>
                </div>
                <div className="student-info">
                  <strong>Mother:</strong>
                  <span>{student.mothersName}</span>
                </div>
                <div className="student-info">
                  <strong>Enrolled:</strong>
                  <span>{student.enrollmentDate}</span>
                </div>
                <div className="course-badge">
                  {student.course}
                </div>
                <button
                  onClick={() => deleteStudent(student.id)}
                  className="btn btn-secondary"
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  <Trash2 size={16} />
                  Remove Student
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 