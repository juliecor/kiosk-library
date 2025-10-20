import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import "./StudentBooks.css";
import bclogo from "../assets/bclogo.jpg";
import BookDetailsModal from "../components/admin/students/BookDetailsModal";

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

  // NEW STATES for two-step modal
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // NEW STATES for filters/sorting
  const [filterShelf, setFilterShelf] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Inactivity timer
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 120000; // 2 minutes in milliseconds

  useEffect(() => {
    fetchBooks();
    startInactivityTimer();

    // Add event listeners for activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      // Cleanup
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
    setShowTerms(false); // Start at step 1
    setAgreedToTerms(false); // Reset agreement
    setFailedAttempts(0); // Reset attempts when opening new borrow request
  };

  const handlePreviewClick = (book) => {
    setViewingBook(book);
  };

  const handleClosePreview = () => {
    setViewingBook(null);
  };

  // NEW: Handle moving from step 1 to step 2
  const handleNextToTerms = () => {
    if (!studentId.trim()) {
      toast.error("Please enter your Student ID", {
        duration: 3000,
        position: 'top-center',
        icon: '⚠️',
      });
      return;
    }
    setShowTerms(true); // Move to step 2
  };

  // NEW: Handle going back from step 2 to step 1
  const handleBackToId = () => {
    setShowTerms(false);
    setAgreedToTerms(false);
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

    // Show loading toast
    const loadingToast = toast.loading('Submitting your request...', {
      position: 'top-center',
    });

    try {
      await axios.post("http://localhost:5000/api/borrow/request", {
        studentId,
        bookId: selectedBook._id,
      });

      // Dismiss loading
      toast.dismiss(loadingToast);
      
      // Close popup immediately
      setShowPopup(false);
      setStudentId("");
      setSelectedBook(null);
      setShowTerms(false);
      setAgreedToTerms(false);

      // Show success message
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

      // Auto-return to landing page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

      fetchBooks();
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.error("Error submitting borrow request:", error);
      
      const errorMessage = error.response?.data?.message || "Failed to submit borrow request";
      const currentBook = error.response?.data?.currentBook;

      // Increment failed attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // Check if max attempts reached
      if (newAttempts >= 3) {
        toast.error(
          `😟 Too many failed attempts!\n\nPlease ask a librarian for help.\nReturning to home page...`,
          {
            duration: 3000,
            position: 'top-center',
            style: {
              borderRadius: '16px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '24px 32px',
              textAlign: 'center',
            },
          }
        );

        // Close popup
        setShowPopup(false);
        setStudentId("");
        setSelectedBook(null);
        setShowTerms(false);
        setAgreedToTerms(false);

        // Auto-return to landing page after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
        return;
      }

      // Show error toast with remaining attempts
      if (currentBook) {
        toast.error(
          `🚫 Cannot borrow!\n\nYou must return "${currentBook}" first.\n\nAttempts left: ${3 - newAttempts}`,
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
      } else {
        toast.error(
          `❌ ${errorMessage}\n\nAttempts left: ${3 - newAttempts}\nPlease try again.`,
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

      // Go back to step 1 for retry
      setShowTerms(false);
      setAgreedToTerms(false);
      setStudentId("");
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setStudentId("");
    setSelectedBook(null);
    setFailedAttempts(0);
    setShowTerms(false);
    setAgreedToTerms(false);
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

  // Calculate due date (1 day from now)
  const calculateDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Unique filter options
  const shelfOptions = [...new Set(books.map(b => b.shelfLocation).filter(Boolean))];
  const yearOptions = [...new Set(books.map(b => b.publicationYear).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="student-books-container">
      {/* Toast Container */}
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

      <div className="student-books-header">
        <h1 className="student-books-title">BENEDICTO COLLEGE LIBRARY BOOKS</h1>
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

      {/* Filters Section */}
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

      {/* Borrow Popup - STEP 1: Enter Student ID */}
      {showPopup && selectedBook && !showTerms && (
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
              <label htmlFor="studentId">
                ENTER STUDENT ID
                {failedAttempts > 0 && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>
                    (Attempts left: {3 - failedAttempts})
                  </span>
                )}
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="student-id-input"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleNextToTerms();
                  }
                }}
              />
            </div>

            <div className="popup-buttons">
              <button onClick={handleNextToTerms} className="confirm-btn">Next →</button>
              <button onClick={handleClosePopup} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Popup - STEP 2: Terms & Guidelines */}
      {showPopup && selectedBook && showTerms && (
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
                    <strong>Student ID:</strong>
                    <p>{studentId}</p>
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
                    <p>You'll receive SMS reminders about due dates and fees</p>
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
              <button onClick={handleBackToId} className="cancel-btn">← Back</button>
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
    </div>
  );
}