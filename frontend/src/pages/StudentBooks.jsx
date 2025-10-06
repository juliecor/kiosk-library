import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentBooks.css";
import bclogo from "../assets/bclogo.jpg";

export default function StudentBooks() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/books");
      if (res.data.success) {
        // Only show available books
        setBooks(res.data.books.filter(book => book.availableCopies > 0));
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search - search by title, author, ISBN, and category
  const filteredBooks = books.filter((book) => {
    const searchLower = search.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      (book.ISBN && book.ISBN.toLowerCase().includes(searchLower)) ||
      (book.category && book.category.toLowerCase().includes(searchLower))
    );
  });

  const handleBorrowClick = (book) => {
    setSelectedBook(book);
    setShowPopup(true);
  };

  const handleBorrowConfirm = async () => {
    if (!studentId.trim()) {
      alert("Please enter your Student ID.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/borrow/request", {
        studentId,
        bookId: selectedBook._id,
      });

      alert("Borrow request submitted successfully!");
      setShowPopup(false);
      setStudentId("");
      setSelectedBook(null);
      fetchBooks(); // Refresh to update available copies
    } catch (error) {
      console.error("Error submitting borrow request:", error);
      alert(error.response?.data?.message || "Failed to submit borrow request.");
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setStudentId("");
    setSelectedBook(null);
  };

  return (
    <div className="student-books-container">
      {/* Header Section */}
      <div className="student-books-header">
        <h1 className="student-books-title">BENEDICTO COLLEGE LIBRARY BOOKS</h1>
        
      </div>

      {/* Search Bar */}
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

      {/* Results Count */}
      {!loading && (
        <div className="results-count">
          <p>
            Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      ) : (
        /* Book Grid */
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
                  
                  {/* Tags */}
                  <div className="book-tags">
                    {book.category && (
                      <span className="tag category-tag">{book.category}</span>
                    )}
                    {book.publicationYear && (
                      <span className="tag year-tag">{book.publicationYear}</span>
                    )}
                  </div>

                  {/* Availability Badge */}
                  <div className="availability-badge">
                    <span className="badge-icon">✓</span>
                    <span className="badge-text">
                      {book.availableCopies} {book.availableCopies === 1 ? 'copy' : 'copies'} available
                    </span>
                  </div>
                </div>

                <button
                  className="student-borrow-btn"
                  onClick={() => handleBorrowClick(book)}
                >
                  <span className="btn-icon">📖</span>
                  <span>Borrow Book</span>
                </button>
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

      {/* Borrow Popup */}
      {showPopup && selectedBook && (
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
                placeholder=""
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="student-id-input"
                autoFocus
              />
            </div>

            <div className="popup-buttons">
              <button onClick={handleBorrowConfirm} className="confirm-btn">
                Confirm Request
              </button>
              <button onClick={handleClosePopup} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}