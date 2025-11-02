// components/pages/StudentBorrowedBooksModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./StudentBorrowedBooksModal.css";
import bclogo from "../assets/bclogo.jpg";

export default function StudentBorrowedBooksModal({ studentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    if (studentId) {
      fetchBorrowedBooks();
    }
  }, [studentId]);

  const fetchBorrowedBooks = async () => {
    setLoading(true);
    try {
      // Fetch student info
      const studentRes = await axios.get(`http://localhost:5000/api/students/${studentId}`);
      const currentStudent = studentRes.data.student;
      setStudent(currentStudent);

      console.log("Fetching borrow requests for student:", {
        studentId,
        studentData: currentStudent
      });

      // Try to fetch borrow requests using the student ID
      try {
        // First try: Direct API call for student's borrow requests
        const studentRequestsRes = await axios.get(`http://localhost:5000/api/borrow/student/${studentId}`);
        
        if (studentRequestsRes.data.success) {
          console.log("Found requests via student endpoint:", studentRequestsRes.data.requests);
          setBorrowedBooks(studentRequestsRes.data.requests || []);
        } else {
          throw new Error('Using fallback method');
        }
      } catch (fallbackError) {
        console.log('Using fallback method for fetching borrowed books');
        
        // Fallback: Fetch all borrow requests and filter
        const allRequestsRes = await axios.get("http://localhost:5000/api/borrow/requests");
        
        if (allRequestsRes.data.success) {
          console.log("All requests:", allRequestsRes.data.requests);
          
          // 🆕 IMPROVED FILTER: Check multiple possible student reference formats
          const studentRequests = allRequestsRes.data.requests.filter(req => {
            // Debug each request
            console.log("Checking request:", {
              requestId: req._id,
              requestStudent: req.student,
              requestStudentId: req.studentId,
              lookingFor: studentId
            });

            // Check different possible formats:
            
            // Format 1: req.student is the student ID string (like "2022-00083")
            if (req.student === studentId) {
              console.log("Matched via req.student");
              return true;
            }
            
            // Format 2: req.studentId field exists and matches
            if (req.studentId && req.studentId === studentId) {
              console.log("Matched via req.studentId");
              return true;
            }
            
            // Format 3: req.student is an object with studentId property
            if (req.student && typeof req.student === 'object' && req.student.studentId === studentId) {
              console.log("Matched via req.student.studentId");
              return true;
            }
            
            // Format 4: req.student is an object with _id property (if studentId is stored as _id)
            if (req.student && typeof req.student === 'object' && req.student._id === studentId) {
              console.log("Matched via req.student._id");
              return true;
            }

            return false;
          });
          
          console.log("Filtered student requests:", studentRequests);
          setBorrowedBooks(studentRequests);
        }
      }
    } catch (error) {
      console.error("Error fetching borrowed books:", error);
      toast.error("Failed to load borrowed books", {
        duration: 3000,
        position: 'top-center',
      });
      setBorrowedBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
  // Filter books
  const currentBooks = borrowedBooks.filter(
    book => book.status === "approved" && !book.returnDate
  );
  
  const historyBooks = borrowedBooks.filter(
    book => book.status === "returned" || book.status === "denied" || book.returnDate
  );

  // Calculate if book is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (book) => {
    if (book.status === "pending") {
      return <span className="status-badge pending">⏳ Pending Approval</span>;
    }
    if (book.status === "denied") {
      return <span className="status-badge denied">❌ Denied</span>;
    }
    if (book.status === "approved" && !book.returnDate) {
      if (isOverdue(book.dueDate)) {
        return <span className="status-badge overdue">⚠️ Overdue</span>;
      }
      return <span className="status-badge active">📖 Currently Borrowed</span>;
    }
    if (book.status === "returned") {
      if (book.isLate) {
        return <span className="status-badge late">⏰ Returned Late</span>;
      }
      return <span className="status-badge returned">✅ Returned</span>;
    }
    return <span className="status-badge">{book.status}</span>;
  };

  // Get condition badge
  const getConditionBadge = (condition) => {
    if (!condition) return null;
    
    const badges = {
      good: { icon: "✅", text: "Good Condition", color: "#10b981" },
      damaged: { icon: "⚠️", text: "Damaged", color: "#f59e0b" },
      lost: { icon: "❌", text: "Lost", color: "#ef4444" }
    };
    
    const badge = badges[condition.toLowerCase()] || badges.good;
    
    return (
      <span className="condition-badge" style={{ backgroundColor: badge.color }}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  return (
    <div className="borrowed-modal-overlay" onClick={onClose}>
      <div className="borrowed-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        {/* Header */}
        <div className="borrowed-modal-header">
          <img src={bclogo} alt="Logo" className="borrowed-modal-logo" />
          <h2>My Borrowed Books</h2>
          {student && (
            <p className="student-name">
              {student.firstName} {student.lastName} • {studentId}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="borrowed-tabs">
         
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            History ({historyBooks.length})
          </button>
        </div>

        {/* Content */}
        <div className="borrowed-modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your books...</p>
            </div>
          ) : (
            <>
              {/* Current Borrowed Books */}
              {activeTab === "current" && (
                <div className="borrowed-list">
                  {currentBooks.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📚</span>
                      <h3>No Currently Borrowed Books</h3>
                      <p>You don't have any active borrowed books</p>
                    </div>
                  ) : (
                    currentBooks.map((request) => (
                      <div key={request._id} className="borrowed-card current-card">
                        <div className="book-image-section">
                          {request.book?.coverImage ? (
                            <img
                              src={`http://localhost:5000${request.book.coverImage}`}
                              alt={request.book.title}
                              className="book-thumbnail"
                            />
                          ) : (
                            <div className="no-thumbnail">📖</div>
                          )}
                        </div>

                        <div className="book-details-section">
                          <h3 className="book-card-title">{request.book?.title || "Unknown Book"}</h3>
                          <p className="book-card-author">by {request.book?.author || "Unknown"}</p>
                          
                          {getStatusBadge(request)}

                          <div className="book-dates">
                            <div className="date-item">
                              <span className="date-label">📅 Borrowed:</span>
                              <span className="date-value">{formatDate(request.borrowDate)}</span>
                            </div>
                            <div className="date-item">
                              <span className="date-label">⏰ Due Date:</span>
                              <span className={`date-value ${isOverdue(request.dueDate) ? 'overdue-text' : ''}`}>
                                {formatDate(request.dueDate)}
                                {isOverdue(request.dueDate) && " (OVERDUE)"}
                              </span>
                            </div>
                          </div>

                          {isOverdue(request.dueDate) && (
                            <div className="fee-warning">
                              ⚠️ This book is overdue! Late fees apply (₱5 per day)
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* History */}
              {activeTab === "history" && (
                <div className="borrowed-list">
                  {historyBooks.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📋</span>
                      <h3>No Borrow History</h3>
                      <p>Your past borrowed books will appear here</p>
                    </div>
                  ) : (
                    historyBooks.map((request) => (
                      <div key={request._id} className="borrowed-card history-card">
                        <div className="book-image-section">
                          {request.book?.coverImage ? (
                            <img
                              src={`http://localhost:5000${request.book.coverImage}`}
                              alt={request.book.title}
                              className="book-thumbnail"
                            />
                          ) : (
                            <div className="no-thumbnail">📖</div>
                          )}
                        </div>

                        <div className="book-details-section">
                          <h3 className="book-card-title">{request.book?.title || "Unknown Book"}</h3>
                          <p className="book-card-author">by {request.book?.author || "Unknown"}</p>
                          
                          <div className="status-row">
                            {getStatusBadge(request)}
                            {request.bookCondition && getConditionBadge(request.bookCondition)}
                          </div>

                          <div className="book-dates">
                            <div className="date-item">
                              <span className="date-label">📅 Borrowed:</span>
                              <span className="date-value">{formatDate(request.borrowDate)}</span>
                            </div>
                            {request.returnDate && (
                              <div className="date-item">
                                <span className="date-label">✅ Returned:</span>
                                <span className="date-value">{formatDate(request.returnDate)}</span>
                              </div>
                            )}
                          </div>

                          {/* Fees Section */}
                          {(request.lateFee > 0 || request.damageFee > 0) && (
                            <div className="fees-section">
                              <h4 className="fees-title">💰 Fees:</h4>
                              <div className="fee-breakdown">
                                {request.lateFee > 0 && (
                                  <div className="fee-row">
                                    <span>Late Fee:</span>
                                    <span className="fee-amount">₱{request.lateFee}</span>
                                  </div>
                                )}
                                {request.damageFee > 0 && (
                                  <div className="fee-row">
                                    <span>
                                      {request.bookCondition === "lost" ? "Replacement Fee:" : "Damage Fee:"}
                                    </span>
                                    <span className="fee-amount">₱{request.damageFee}</span>
                                  </div>
                                )}
                                <div className="fee-row total-fee">
                                  <span>Total:</span>
                                  <span className="fee-amount">₱{request.totalFee || 0}</span>
                                </div>
                              </div>
                              {request.paid ? (
                                <div className="paid-badge">✅ Paid</div>
                              ) : (
                                <div className="unpaid-badge">⚠️ Unpaid - Please pay at library desk</div>
                              )}
                            </div>
                          )}

                          {/* Damage Description */}
                          {request.damageDescription && (
                            <div className="damage-description">
                              <strong>Note:</strong> {request.damageDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="borrowed-modal-footer">
          <button onClick={onClose} className="close-footer-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}