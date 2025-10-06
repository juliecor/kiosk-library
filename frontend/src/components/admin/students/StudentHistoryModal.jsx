// components/admin/students/StudentHistoryModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentHistoryModal.css';

function StudentHistoryModal({ studentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudentHistory();
  }, [studentId]);

  const fetchStudentHistory = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/students/${studentId}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setData(response.data);
      }
    } catch (err) {
      setError('Failed to load student history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'badge-pending' },
      approved: { text: 'Borrowed', class: 'badge-approved' },
      denied: { text: 'Denied', class: 'badge-denied' },
      returned: { text: 'Returned', class: 'badge-returned' }
    };
    return badges[status] || { text: status, class: '' };
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (borrowDate) => {
    const due = new Date(borrowDate);
    due.setDate(due.getDate() + 1);
    return new Date() > due;
  };

  if (loading) {
    return (
      <div className="history-modal-overlay" onClick={onClose}>
        <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="history-loading">
            <div className="history-spinner"></div>
            <p>Loading history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-modal-overlay" onClick={onClose}>
        <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="history-error">
            <p>{error}</p>
            <button onClick={onClose} className="history-close-btn">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const { student, history, statistics } = data;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="history-modal-header">
          <div>
            <h2 className="history-modal-title">Borrowing History</h2>
            <p className="history-student-name">
              {student.firstName} {student.middleName} {student.lastName}
            </p>
            <p className="history-student-info">
              {student.studentId} • {student.course} {student.yearLevel}
            </p>
          </div>
          <button onClick={onClose} className="history-close-button">✕</button>
        </div>

        {/* Statistics */}
        <div className="history-stats-grid">
          <div className="history-stat-card">
            <div className="history-stat-label">Total Borrowed</div>
            <div className="history-stat-value">{statistics.totalBorrowed}</div>
          </div>
          <div className="history-stat-card">
            <div className="history-stat-label">Currently Borrowed</div>
            <div className="history-stat-value">{statistics.currentBorrows}</div>
          </div>
          <div className="history-stat-card">
            <div className="history-stat-label">Total Returned</div>
            <div className="history-stat-value">{statistics.totalReturned}</div>
          </div>
          <div className="history-stat-card">
            <div className="history-stat-label">Unpaid Fees</div>
            <div className="history-stat-value history-fee-value">
              ₱{statistics.unpaidFees.toFixed(2)}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="history-table-container">
          <h3 className="history-section-title">Borrowing Records</h3>
          {history.length === 0 ? (
            <div className="history-empty">
              <p>No borrowing history yet</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrowed Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Late Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => {
                    const badge = getStatusBadge(record.status);
                    const borrowDate = new Date(record.borrowDate || record.createdAt);
                    const dueDate = new Date(borrowDate);
                    dueDate.setDate(dueDate.getDate() + 1);
                    const overdue = record.status === 'approved' && isOverdue(record.borrowDate || record.createdAt);

                    return (
                      <tr key={record._id}>
                        <td>
                          <div className="history-book-cell">
                            {record.book?.coverImage && (
                              <img 
                                src={`http://localhost:5000${record.book.coverImage}`}
                                alt={record.book?.title}
                                className="history-book-image"
                              />
                            )}
                            <div>
                              <div className="history-book-title">
                                {record.book?.title || 'Unknown Book'}
                              </div>
                              <div className="history-book-author">
                                {record.book?.author}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(record.borrowDate || record.createdAt)}</td>
                        <td>
                          {record.status === 'approved' || record.status === 'returned' ? (
                            <span className={overdue ? 'history-overdue-date' : ''}>
                              {formatDate(dueDate)}
                              {overdue && ' (Overdue)'}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>{formatDate(record.returnDate)}</td>
                        <td>
                          <span className={`history-badge ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td>
                          {record.lateFee > 0 ? (
                            <span className="history-fee">
                              ₱{record.lateFee.toFixed(2)}
                              {record.paid && <span className="history-paid-badge"> (Paid)</span>}
                            </span>
                          ) : (
                            '₱0.00'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentHistoryModal;