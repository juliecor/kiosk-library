// StudentBooks.jsx - Updated with Popup Modal for Borrowed Books
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import "./StudentBooks.css";
import bclogo from "../assets/bclogo.jpg";
import BookDetailsModal from "../components/admin/students/BookDetailsModal";
import OTPModal from "./OTPModal";
import StudentBorrowedBooksModal from "./StudentBorrowedBooksModal";

export default function StudentBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingBook, setViewingBook] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // 🆕 States for borrowed books modal
  const [showBorrowedBooksModal, setShowBorrowedBooksModal] = useState(false);
  const [showBorrowedBooksIdModal, setShowBorrowedBooksIdModal] = useState(false);
  const [borrowedBooksStudentId, setBorrowedBooksStudentId] = useState("");

  // States for multi-step modal flow
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // States for filters/sorting
  const [filterShelf, setFilterShelf] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Student info and status
  const [studentInfo, setStudentInfo] = useState(null);
  const [checkingStudent, setCheckingStudent] = useState(false);

  // Inactivity timer
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 120000;

  useEffect(() => {
    fetchBooks();
    startInactivityTimer();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      clearTimeout(inactivityTimerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  const startInactivityTimer = () => {
    inactivityTimerRef.current = setTimeout(() => {
      toast.loading('Returning to home page...', {
        duration: 2000,
        position: 'top-center',
      });
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, INACTIVITY_TIMEOUT);
  };

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimerRef.current);
    startInactivityTimer();
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/books");
      if (res.data.success) {
        setBooks(res.data.books.filter(book => book.availableCopies > 0));
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load books. Please try again.", {
        duration: 4000,
        position: 'top-center',
      });
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Open borrowed books ID modal
  const handleOpenBorrowedBooksModal = () => {
    setShowBorrowedBooksIdModal(true);
    setBorrowedBooksStudentId("");
  };

  // 🆕 Handle View Borrowed Books from modal
  const handleViewBorrowedBooks = () => {
    if (!borrowedBooksStudentId.trim()) {
      toast.error("Please enter your Student ID", {
        duration: 3000,
        position: 'top-center',
        icon: '⚠️',
      });
      return;
    }

    setCheckingStudent(true);
    axios.get(`http://localhost:5000/api/students/${borrowedBooksStudentId}`)
      .then(response => {
        if (response.data.success) {
          setShowBorrowedBooksIdModal(false);
          setShowBorrowedBooksModal(true);
        }
      })
      .catch(error => {
        console.error("Error verifying student:", error);
        toast.error(
          `❌ Student not found\n\nPlease check your Student ID and try again.`,
          {
            duration: 4000,
            position: 'top-center',
            style: {
              borderRadius: '12px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              padding: '20px 28px',
            },
          }
        );
      })
      .finally(() => {
        setCheckingStudent(false);
      });
  };

  // 🆕 Close borrowed books ID modal
  const handleCloseBorrowedBooksIdModal = () => {
    setShowBorrowedBooksIdModal(false);
    setBorrowedBooksStudentId("");
  };

  // 🆕 Close borrowed books modal
  const handleCloseBorrowedBooksModal = () => {
    setShowBorrowedBooksModal(false);
    setBorrowedBooksStudentId("");
  };

  // Apply filters, search, and sorting
  const filteredBooks = books
    .filter((book) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        (book.ISBN && book.ISBN.toLowerCase().includes(searchLower)) ||
        (book.category && book.category.toLowerCase().includes(searchLower));

      const matchShelf = filterShelf ? book.shelfLocation === filterShelf : true;
      const matchYear = filterYear ? String(book.publicationYear) === filterYear : true;

      return matchSearch && matchShelf && matchYear;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "year") return (b.publicationYear || 0) - (a.publicationYear || 0);
      return 0;
    });

  const handleBorrowClick = (book) => {
    setSelectedBook(book);
    setShowPopup(true);
    setCurrentStep(1);
    setAgreedToTerms(false);
    setFailedAttempts(0);
    setStudentInfo(null);
    setStudentId("");
  };

  const handlePreviewClick = (book) => {
    setViewingBook(book);
  };

  const handleClosePreview = () => {
    setViewingBook(null);
  };

  const checkStudentStatus = async () => {
    if (!studentId.trim()) {
      toast.error("Please enter your Student ID", {
        duration: 3000,
        position: 'top-center',
        icon: '⚠️',
      });
      return;
    }

    setCheckingStudent(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${studentId}`);
      
      if (response.data.success) {
        const student = response.data.student;
        setStudentInfo(student);
        
        if (student.status === 'inactive') {
          toast.error(
            `🚫 Account Inactive\n\nYour library account is currently inactive.\nPlease contact the library to activate your account.`,
            {
              duration: 5000,
              position: 'top-center',
              style: {
                borderRadius: '12px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                padding: '20px 28px',
                maxWidth: '500px',
              },
            }
          );
          return;
        }
        
        const eligibilityCheck = await axios.get(`http://localhost:5000/api/borrow/check-eligibility/${studentId}`);
        
        if (!eligibilityCheck.data.canBorrow) {
          toast.error(
            `🚫 Cannot Borrow\n\n${eligibilityCheck.data.message}`,
            {
              duration: 5000,
              position: 'top-center',
              style: {
                borderRadius: '12px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                padding: '20px 28px',
                maxWidth: '500px',
              },
            }
          );
          return;
        }
        
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error checking student:", error);
      toast.error(
        `❌ Student not found\n\nPlease check your Student ID and try again.`,
        {
          duration: 4000,
          position: 'top-center',
          style: {
            borderRadius: '12px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            padding: '20px 28px',
          },
        }
      );
    } finally {
      setCheckingStudent(false);
    }
  };

  const handleOTPVerified = () => {
    setCurrentStep(3);
  };

  const handleBackFromOTP = () => {
    setCurrentStep(1);
  };

  const handleBackFromTerms = () => {
    setCurrentStep(2);
  };

  const handleBorrowConfirm = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the borrowing guidelines", {
        duration: 3000,
        position: 'top-center',
        icon: '⚠️',
      });
      return;
    }

    const loadingToast = toast.loading('Submitting your request...', {
      position: 'top-center',
    });

    try {
      await axios.post("http://localhost:5000/api/borrow/request", {
        studentId,
        bookId: selectedBook._id,
      });

      toast.dismiss(loadingToast);
      
      setShowPopup(false);
      setStudentId("");
      setSelectedBook(null);
      setCurrentStep(1);
      setAgreedToTerms(false);
      setStudentInfo(null);

      toast.success(
        `🎉 SUCCESS!\n\nBook borrowed successfully!\nReturning to home page...`,
        {
          duration: 3000,
          position: 'top-center',
          style: {
            borderRadius: '16px',
            background: '#10b981',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            padding: '24px 32px',
            textAlign: 'center',
          },
        }
      );

      setTimeout(() => {
        navigate('/');
      }, 3000);

      fetchBooks();
    } catch (error) {
      toast.dismiss(loadingToast);
      
      console.error("Error submitting borrow request:", error);
      
      const errorMessage = error.response?.data?.message || "Failed to submit borrow request";

      toast.error(
        `❌ ${errorMessage}\n\nPlease try again.`,
        {
          duration: 5000,
          position: 'top-center',
          style: {
            borderRadius: '12px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            padding: '20px 28px',
          },
        }
      );
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setStudentId("");
    setSelectedBook(null);
    setFailedAttempts(0);
    setCurrentStep(1);
    setAgreedToTerms(false);
    setStudentInfo(null);
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilterShelf("");
    setFilterYear("");
    setSortBy("");
    toast.success('Filters reset successfully', {
      duration: 2000,
      position: 'bottom-center',
      icon: '🔄',
    });
  };

  const calculateDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const shelfOptions = [...new Set(books.map(b => b.shelfLocation).filter(Boolean))];
  const yearOptions = [...new Set(books.map(b => b.publicationYear).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="student-books-container">
      <Toaster
        toastOptions={{
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />

      {/* 🆕 Header with Borrowed Books Button on Right */}
      <div className="student-books-header">
        <h1 className="student-books-title">BENEDICTO COLLEGE LIBRARY BOOKS</h1>
        <button 
          className="view-borrowed-books-btn"
          onClick={handleOpenBorrowedBooksModal}
        >
          <span className="btn-icon">📚</span>
          View My Borrowed Books
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by title, author, ISBN, or category..."
          className="student-books-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="filters-container">
        <select value={filterShelf} onChange={(e) => setFilterShelf(e.target.value)}>
          <option value="">All Shelf Locations</option>
          {shelfOptions.map((shelf, index) => (
            <option key={index} value={shelf}>{shelf}</option>
          ))}
        </select>

        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {yearOptions.map((year, index) => (
            <option key={index} value={year}>{year}</option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort By</option>
          <option value="title">Title (A–Z)</option>
          <option value="year">Publication Year (Newest)</option>
        </select>

        <button className="reset-filters-btn" onClick={handleResetFilters}>
          Reset Filters
        </button>
      </div>

      {!loading && (
        <div className="results-count">
          <p>
            Showing {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
          </p>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      ) : (
        <div className="student-books-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <div key={book._id} className="student-book-card">
                <div className="book-image-container">
                  {book.coverImage ? (
                    <img
                      src={`http://localhost:5000${book.coverImage}`}
                      alt={book.title}
                      className="student-book-image"
                    />
                  ) : (
                    <div className="no-image">📚</div>
                  )}
                </div>

                <div className="student-book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">by {book.author}</p>

                  <div className="book-tags">
                    {book.category && <span className="tag category-tag">{book.category}</span>}
                    {book.publicationYear && <span className="tag year-tag">{book.publicationYear}</span>}
                  </div>

                  <div className="availability-badge">
                    <span className="badge-icon">✓</span>
                    <span className="badge-text">
                      {book.availableCopies} {book.availableCopies === 1 ? "copy" : "copies"} available
                    </span>
                  </div>
                </div>

                <div className="book-card-actions">
                  <button className="student-preview-btn" onClick={() => handlePreviewClick(book)}>
                    <span className="btn-icon">👁️</span> <span>Preview</span>
                  </button>
                  <button className="student-borrow-btn" onClick={() => handleBorrowClick(book)}>
                    <span className="btn-icon">📖</span> <span>Borrow</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-books">
              <span className="no-books-icon">📚</span>
              <p>No books found</p>
              {search && <p className="no-books-hint">Try adjusting your search</p>}
            </div>
          )}
        </div>
      )}

      {/* Existing Borrow Popup Flow */}
      {showPopup && selectedBook && currentStep === 1 && (
        <div className="student-popup" onClick={handleClosePopup}>
          <div className="student-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleClosePopup}>×</button>

            <div className="popup-header">
              <img src={bclogo} alt="School Logo" className="popup-icon" />
              <h2>Borrow Request</h2>
            </div>

            <div className="popup-book-info">
              <p className="popup-label">You are requesting:</p>
              <p className="popup-book-title">{selectedBook.title}</p>
              <p className="popup-book-author">by {selectedBook.author}</p>
            </div>

            <div className="input-group">
              <label htmlFor="studentId">ENTER STUDENT ID</label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="student-id-input"
                autoFocus
                disabled={checkingStudent}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !checkingStudent) {
                    checkStudentStatus();
                  }
                }}
              />
            </div>

            <div className="popup-buttons">
              <button 
                onClick={checkStudentStatus} 
                className="confirm-btn"
                disabled={checkingStudent}
              >
                {checkingStudent ? 'Checking...' : 'Next →'}
              </button>
              <button onClick={handleClosePopup} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPopup && selectedBook && currentStep === 2 && studentInfo && (
        <OTPModal
          studentId={studentId}
          studentInfo={studentInfo}
          bookTitle={selectedBook.title}
          onVerified={handleOTPVerified}
          onCancel={handleClosePopup}
          onBack={handleBackFromOTP}
        />
      )}

      {showPopup && selectedBook && currentStep === 3 && studentInfo && (
        <div className="student-popup" onClick={handleClosePopup}>
          <div className="student-popup-content terms-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleClosePopup}>×</button>

            <div className="popup-header">
              <img src={bclogo} alt="School Logo" className="popup-icon" />
              <h2>Borrowing Guidelines</h2>
            </div>

            <div className="terms-container">
              <div className="terms-book-info">
                <p className="terms-label">Book:</p>
                <p className="terms-book-title">{selectedBook.title}</p>
                <p className="terms-book-author">by {selectedBook.author}</p>
              </div>

              <div className="terms-details">
                <div className="terms-detail-item">
                  <span className="terms-icon">👤</span>
                  <div>
                    <strong>Student:</strong>
                    <p>{studentInfo.firstName} {studentInfo.lastName}</p>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>ID: {studentId}</p>
                  </div>
                </div>
                <div className="terms-detail-item">
                  <span className="terms-icon">✓</span>
                  <div>
                    <strong>Account Status:</strong>
                    <p>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        textTransform: 'uppercase'
                      }}>
                        ✅ Verified
                      </span>
                    </p>
                  </div>
                </div>
                <div className="terms-detail-item">
                  <span className="terms-icon">📅</span>
                  <div>
                    <strong>Loan Period:</strong>
                    <p>1 day</p>
                  </div>
                </div>
                <div className="terms-detail-item">
                  <span className="terms-icon">⏰</span>
                  <div>
                    <strong>Due Date:</strong>
                    <p>{calculateDueDate()}</p>
                  </div>
                </div>
              </div>

              <div className="terms-divider"></div>

              <div className="terms-guidelines">
                <h3>📋 Borrowing Guidelines:</h3>
                
                <div className="guideline-item">
                  <span className="guideline-icon">⏱️</span>
                  <div>
                    <strong>Late Returns:</strong>
                    <p>₱5 per day overdue</p>
                  </div>
                </div>

                <div className="guideline-item">
                  <span className="guideline-icon">📖</span>
                  <div>
                    <strong>Damaged Books:</strong>
                    <p>₱50-₱500 (depending on damage level)</p>
                  </div>
                </div>

                <div className="guideline-item">
                  <span className="guideline-icon">❌</span>
                  <div>
                    <strong>Lost Books:</strong>
                    <p>Full replacement cost</p>
                  </div>
                </div>

                <div className="guideline-item">
                  <span className="guideline-icon">📱</span>
                  <div>
                    <strong>Notifications:</strong>
                    <p>You'll receive SMS reminders</p>
                  </div>
                </div>
              </div>

              <div className="terms-agreement">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="agreement-text">
                    I agree to return the book on time and in good condition
                  </span>
                </label>
              </div>
            </div>

            <div className="popup-buttons">
              <button onClick={handleBackFromTerms} className="cancel-btn">← Back</button>
              <button 
                onClick={handleBorrowConfirm} 
                className={`confirm-btn ${!agreedToTerms ? 'disabled' : ''}`}
                disabled={!agreedToTerms}
              >
                Confirm Borrow
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingBook && (
        <BookDetailsModal book={viewingBook} onClose={handleClosePreview} onBorrow={handleBorrowClick} />
      )}

      {/* 🆕 Borrowed Books ID Input Modal */}
      {showBorrowedBooksIdModal && (
        <div className="student-popup" onClick={handleCloseBorrowedBooksIdModal}>
          <div className="student-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseBorrowedBooksIdModal}>×</button>

            <div className="popup-header">
              <img src={bclogo} alt="School Logo" className="popup-icon" />
              <h2>View Borrowed Books</h2>
            </div>

            <div className="popup-book-info">
              <p className="popup-label">Enter your Student ID to view your borrowed books history</p>
            </div>

            <div className="input-group">
              <label htmlFor="borrowedBooksStudentId">STUDENT ID</label>
              <input
                id="borrowedBooksStudentId"
                type="text"
                value={borrowedBooksStudentId}
                onChange={(e) => setBorrowedBooksStudentId(e.target.value)}
                className="student-id-input"
                autoFocus
                disabled={checkingStudent}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !checkingStudent) {
                    handleViewBorrowedBooks();
                  }
                }}
              />
            </div>

            <div className="popup-buttons">
              <button 
                onClick={handleViewBorrowedBooks} 
                className="confirm-btn"
                disabled={checkingStudent}
              >
                {checkingStudent ? 'Checking...' : 'View Books →'}
              </button>
              <button onClick={handleCloseBorrowedBooksIdModal} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Borrowed Books Modal */}
      {showBorrowedBooksModal && (
        <StudentBorrowedBooksModal 
          studentId={borrowedBooksStudentId}
          onClose={handleCloseBorrowedBooksModal}
        />
      )}
    </div>
  );
}