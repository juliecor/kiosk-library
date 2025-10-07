// components/student/BookDetailsModal.jsx
import React from 'react';
import './BookDetailsModal.css';

function BookDetailsModal({ book, onClose, onBorrow }) {
  if (!book) return null;

  return (
    <div className="book-details-overlay" onClick={onClose}>
      <div className="book-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="book-details-close" onClick={onClose}>×</button>
        
        <div className="book-details-content">
          {/* Left side - Book Image */}
          <div className="book-details-left">
            {book.coverImage ? (
              <img
                src={`http://localhost:5000${book.coverImage}`}
                alt={book.title}
                className="book-details-image"
              />
            ) : (
              <div className="book-details-no-image">
                <span>📚</span>
              </div>
            )}
            
            <div className="book-availability-info">
              <div className="availability-indicator">
                <span className="indicator-dot"></span>
                <span className="indicator-text">
                  {book.availableCopies} of {book.totalCopies} available
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Book Details */}
          <div className="book-details-right">
            <div className="book-details-header">
              <h2 className="book-details-title">{book.title}</h2>
              <p className="book-details-author">by {book.author}</p>
            </div>

            {/* Description */}
            {book.description && (
              <div className="book-details-section">
                <h3 className="section-title">Description</h3>
                <p className="book-description">{book.description}</p>
              </div>
            )}

            {/* Book Information Grid */}
            <div className="book-details-section">
              <h3 className="section-title">Book Information</h3>
              <div className="book-info-grid">
                {book.ISBN && (
                  <div className="info-item">
                    <span className="info-label">ISBN:</span>
                    <span className="info-value">{book.ISBN}</span>
                  </div>
                )}
                
                {book.category && (
                  <div className="info-item">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{book.category}</span>
                  </div>
                )}

                {book.publisher && (
                  <div className="info-item">
                    <span className="info-label">Publisher:</span>
                    <span className="info-value">{book.publisher}</span>
                  </div>
                )}

                {book.publicationYear && (
                  <div className="info-item">
                    <span className="info-label">Publication Year:</span>
                    <span className="info-value">{book.publicationYear}</span>
                  </div>
                )}

                {book.volume && (
                  <div className="info-item">
                    <span className="info-label">Volume:</span>
                    <span className="info-value">{book.volume}</span>
                  </div>
                )}

                {book.shelfLocation && (
                  <div className="info-item">
                    <span className="info-label">Shelf Location:</span>
                    <span className="info-value">{book.shelfLocation}</span>
                  </div>
                )}

                {book.editions && book.editions.length > 0 && (
                  <div className="info-item full-width">
                    <span className="info-label">Editions:</span>
                    <span className="info-value">{book.editions.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="book-details-actions">
              <button 
                className="borrow-from-details-btn"
                onClick={() => {
                  onClose();
                  onBorrow(book);
                }}
              >
                <span>📖</span>
                Borrow This Book
              </button>
              <button 
                className="close-details-btn"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetailsModal;