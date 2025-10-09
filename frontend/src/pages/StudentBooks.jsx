import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentBooks.css";
import bclogo from "../assets/bclogo.jpg";
import BookDetailsModal from "../components/admin/students/BookDetailsModal";

export default function StudentBooks() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingBook, setViewingBook] = useState(null);

  // NEW STATES for filters/sorting
  const [filterShelf, setFilterShelf] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

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
  };

  const handlePreviewClick = (book) => {
    setViewingBook(book);
  };

  const handleClosePreview = () => {
    setViewingBook(null);
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
      fetchBooks();
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

  const handleResetFilters = () => {
    setSearch("");
    setFilterShelf("");
    setFilterYear("");
    setSortBy("");
  };

  // Unique filter options
  const shelfOptions = [...new Set(books.map(b => b.shelfLocation).filter(Boolean))];
  const yearOptions = [...new Set(books.map(b => b.publicationYear).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="student-books-container">
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
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="student-id-input"
                autoFocus
              />
            </div>

            <div className="popup-buttons">
              <button onClick={handleBorrowConfirm} className="confirm-btn">Confirm Request</button>
              <button onClick={handleClosePopup} className="cancel-btn">Cancel</button>
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
