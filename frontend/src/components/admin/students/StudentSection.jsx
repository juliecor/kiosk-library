import React from 'react';
import StudentHistoryModal from './StudentHistoryModal';

function StudentSection({
  studentTab,
  setStudentTab,
  studentForm,
  formMessage,
  formLoading,
  handleStudentFormChange,
  handleStudentSubmit,
  educationLevels,
  students,
  studentsLoading,
  searchTerm,
  setSearchTerm,
  viewingStudent,              
  handleViewStudent,           
  handleCloseStudentView,
  viewingHistory,              
  handleViewHistory,           
  handleCloseHistory           
}) {
  return (
    <div className="admin-dashboard-content">
      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setStudentTab('register')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: studentTab === 'register' ? '3px solid #3b82f6' : '3px solid transparent',
              color: studentTab === 'register' ? '#3b82f6' : '#6b7280',
              fontWeight: studentTab === 'register' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
          >
            📝 Register Student
          </button>
          <button
            onClick={() => setStudentTab('view')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: studentTab === 'view' ? '3px solid #3b82f6' : '3px solid transparent',
              color: studentTab === 'view' ? '#3b82f6' : '#6b7280',
              fontWeight: studentTab === 'view' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
          >
            👥 View All Students
          </button>
        </div>
      </div>

      {/* Register Tab Content - UNCHANGED */}
      {studentTab === 'register' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            backgroundColor: '#f5f5f6ff', 
            borderRadius: '12px', 
            padding: '32px', 
            boxShadow: '0 5px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e7e1e1ff'
          }}>
            <h2 style={{ 
              fontSize: '30px', 
              fontWeight: '600', 
              color: '#1d1e20ff', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Register New Student
            </h2>

            {formMessage.text && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: formMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: formMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${formMessage.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
              }}>
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleStudentSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#121212ff', marginBottom: '6px' }}>
                    First Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={studentForm.firstName}
                    onChange={handleStudentFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                      border: '1px solid #dbdfe5ff',
                      borderRadius: '6px',
                      fontSize: '15px'
                    }}
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={studentForm.middleName}
                    onChange={handleStudentFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                       color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Santos"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Last Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={studentForm.lastName}
                  onChange={handleStudentFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                     color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Dela Cruz"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Education Level <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="educationLevel"
                    value={studentForm.educationLevel}
                    onChange={handleStudentFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                       color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Education Level</option>
                    <option value="Junior High School">Junior High School</option>
                    <option value="Senior High School">Senior High School</option>
                    <option value="College">College</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202022ff', marginBottom: '6px' }}>
                    Year Level <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="yearLevel"
                    value={studentForm.yearLevel}
                    onChange={handleStudentFormChange}
                    required
                    disabled={!studentForm.educationLevel}
                    style={{
                      width: '100%',
                       color:'#373737ff',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: !studentForm.educationLevel ? '#f3f4f6' : 'white',
                      cursor: !studentForm.educationLevel ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">
                      {!studentForm.educationLevel ? 'Select Education Level First' : 'Select Year Level'}
                    </option>
                    {studentForm.educationLevel && 
                      educationLevels[studentForm.educationLevel].levels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {studentForm.educationLevel && educationLevels[studentForm.educationLevel].courses && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    {studentForm.educationLevel === 'College' ? 'Course' : 'Strand'} <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="course"
                    value={studentForm.course}
                    onChange={handleStudentFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                       color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select {studentForm.educationLevel === 'College' ? 'Course' : 'Strand'}</option>
                    {educationLevels[studentForm.educationLevel].courses.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Student ID <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={studentForm.studentId}
                  onChange={handleStudentFormChange}
                  required
                  style={{
                    width: '100%',
                    color:'#373737ff',
                     backgroundColor: '#ffffffff', 
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="2024-12345"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={studentForm.contactNumber}
                    onChange={handleStudentFormChange}
                    style={{
                      width: '100%',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="09123456789"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={studentForm.email}
                    onChange={handleStudentFormChange}
                    style={{
                      width: '100%',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff', 
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  color: 'white',
                  backgroundColor: formLoading ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!formLoading) e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  if (!formLoading) e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                {formLoading ? 'Registering...' : 'Register Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Students Tab Content */}
      {studentTab === 'view' && (
        <div>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: 0 
              }}>
                All Students ({students.length})
              </h2>
              
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 16px',
                  color:'#373737ff',
                  backgroundColor: '#ffffffff', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  width: '300px',
                  fontSize: '14px'
                }}
              />
            </div>

            {studentsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p style={{ color: '#6b7280' }}>Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '18px', color: '#6b7280' }}>No students registered yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Student ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Education Level</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Course/Strand</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Year Level</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Contact</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(student => {
                        const search = searchTerm.toLowerCase();
                        const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.toLowerCase();
                        return fullName.includes(search) || student.studentId.toLowerCase().includes(search);
                      })
                      .map((student, index) => (
                        <tr 
                          key={student._id} 
                          style={{ 
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                          }}
                        >
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {student.studentId}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                            {student.firstName} {student.middleName} {student.lastName}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                            {student.educationLevel || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                            {student.course || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                            {student.yearLevel}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                            {student.contactNumber || student.email || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleViewStudent(student)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  backgroundColor: '#eff6ff',
                                  color: '#1e40af',
                                  border: '1px solid #3b82f6',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                Info
                              </button>
                              {/* NEW: History Button */}
                              <button
                                onClick={() => handleViewHistory(student.studentId)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  backgroundColor: '#f3e8ff',
                                  color: '#7c3aed',
                                  border: '1px solid #8b5cf6',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="View Borrowing History"
                              >
                                History
                              </button>
                              <button
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fbbf24',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Student Modal - UNCHANGED */}
      {viewingStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Student Details
              </h2>
              <button
                onClick={handleCloseStudentView}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  STUDENT ID
                </label>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                  {viewingStudent.studentId}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  FULL NAME
                </label>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                  {viewingStudent.firstName} {viewingStudent.middleName} {viewingStudent.lastName}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                    EDUCATION LEVEL
                  </label>
                  <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                    {viewingStudent.educationLevel || 'N/A'}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                    YEAR LEVEL
                  </label>
                  <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                    {viewingStudent.yearLevel}
                  </p>
                </div>
              </div>

              {viewingStudent.course && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                    COURSE/STRAND
                  </label>
                  <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                    {viewingStudent.course}
                  </p>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  CONTACT NUMBER
                </label>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                  {viewingStudent.contactNumber || 'Not provided'}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  EMAIL
                </label>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                  {viewingStudent.email || 'Not provided'}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  REGISTERED ON
                </label>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0 }}>
                  {new Date(viewingStudent.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseStudentView}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* NEW: Student History Modal */}
      {viewingHistory && (
        <StudentHistoryModal
          studentId={viewingHistory}
          onClose={handleCloseHistory}
        />
      )}
    </div>
  );
}

export default StudentSection;