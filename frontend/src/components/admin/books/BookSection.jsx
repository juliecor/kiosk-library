import React from 'react';

function BookSection({
  bookTab,
  setBookTab,
  bookForm,
  bookMessage,
  bookLoading,
  handleBookFormChange,
  handleBookSubmit,
  imagePreview,
  handleImageChange,
  books,
  booksLoading,
  bookSearchTerm,
  setBookSearchTerm,
  handleEditBook,
  handleDeleteBook,
  editingBook,
  editBookForm,
  editImagePreview,
  handleEditBookFormChange,
  handleEditImageChange,
  handleUpdateBook,
  handleCancelEdit
}) {
  return (
    <div className="admin-dashboard-content">
      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setBookTab('add')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: bookTab === 'add' ? '3px solid #3b82f6' : '3px solid transparent',
              color: bookTab === 'add' ? '#3b82f6' : '#6b7280',
              fontWeight: bookTab === 'add' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
          >
            📚 Add New Book
          </button>
          <button
            onClick={() => setBookTab('view')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: bookTab === 'view' ? '3px solid #3b82f6' : '3px solid transparent',
              color: bookTab === 'view' ? '#3b82f6' : '#6b7280',
              fontWeight: bookTab === 'view' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
          >
            📖 View All Books
          </button>
          {editingBook && (
            <button
              onClick={() => setBookTab('edit')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'transparent',
                borderBottom: bookTab === 'edit' ? '3px solid #3b82f6' : '3px solid transparent',
                color: bookTab === 'edit' ? '#3b82f6' : '#6b7280',
                fontWeight: bookTab === 'edit' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.2s'
              }}
            >
              ✏️ Edit Book
            </button>
          )}
        </div>
      </div>

      {/* Add Book Tab */}
      {bookTab === 'add' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ 
            backgroundColor: ' #f4f5f7ff', 
            borderRadius: '12px', 
            padding: '32px', 
            boxShadow: '0 2px 5x 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #aaaaacff'
          }}>
            <h2 style={{ 
              fontSize: '30px', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Add New Book
            </h2>

            {bookMessage.text && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: bookMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: bookMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${bookMessage.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
              }}>
                {bookMessage.text}
              </div>
            )}

            <form onSubmit={handleBookSubmit}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                  Book Cover Image
                </label>
                
                {imagePreview && (
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={imagePreview} 
                      alt="Book cover preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="bookCoverInput"
                />
                <label
                  htmlFor="bookCoverInput"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Book Title <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={bookForm.title}
                    onChange={handleBookFormChange}
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
                    placeholder="Enter book title"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    ISBN
                  </label>
                  <input
                    type="text"
                    name="ISBN"
                    value={bookForm.ISBN}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="978-3-16-148410-0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Author <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={bookForm.author}
                    onChange={handleBookFormChange}
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
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={bookForm.category}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Fiction, Science, etc."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Publisher
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={bookForm.publisher}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Publisher name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Publication Year
                  </label>
                  <input
                    type="number"
                    name="publicationYear"
                    value={bookForm.publicationYear}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="2024"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Volume
                  </label>
                  <input
                    type="text"
                    name="volume"
                    value={bookForm.volume}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Vol. 1"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    name="shelfLocation"
                    value={bookForm.shelfLocation}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="A-12, B-05, etc."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Editions
                  </label>
                  <input
                    type="text"
                    name="editions"
                    value={bookForm.editions}
                    onChange={handleBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="1st, 2nd (comma separated)"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Total Copies <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="totalCopies"
                    value={bookForm.totalCopies}
                    onChange={handleBookFormChange}
                    required
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Available Copies <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="availableCopies"
                    value={bookForm.availableCopies}
                    onChange={handleBookFormChange}
                    required
                    min="0"
                    max={bookForm.totalCopies}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color:'#373737ff',
                       backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                   <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '6px' 
                  }}>
                    Description / Introduction
                  </label>
                  <textarea
                    name="description"
                    value={bookForm.description || ''}
                    onChange={handleBookFormChange}
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      color: '#373737ff',
                      backgroundColor: '#ffffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Write a short description about this book..."
                  ></textarea>
                </div>

              </div>

              <button
                type="submit"
                disabled={bookLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  color: 'white',
                  backgroundColor: bookLoading ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  cursor: bookLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!bookLoading) e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  if (!bookLoading) e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                {bookLoading ? 'Adding Book...' : 'Add Book to Library'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Books Tab */}
      {bookTab === 'view' && (
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
                All Books ({books.length})
              </h2>
              
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={bookSearchTerm}
                onChange={(e) => setBookSearchTerm(e.target.value)}
                style={{
                  padding: '10px 16px',
                  backgroundColor:'#eaedf2ff',
                  color:'#151616ff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  width: '300px',
                  fontSize: '14px'
                }}
              />
            </div>

            {booksLoading ? (
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
                <p style={{ color: '#6b7280' }}>Loading books...</p>
              </div>
            ) : books.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '18px', color: '#6b7280' }}>No books added yet</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '24px' 
              }}>
                {books
                  .filter(book => {
                    const search = bookSearchTerm.toLowerCase();
                    return (
                      book.title.toLowerCase().includes(search) ||
                      book.author.toLowerCase().includes(search) ||
                      (book.ISBN && book.ISBN.toLowerCase().includes(search))
                    );
                  })
                  .map((book) => (
                    <div 
                      key={book._id} 
                      style={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ 
                        height: '280px', 
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {book.coverImage ? (
                          <img 
                            src={`http://localhost:5000${book.coverImage}`}
                            alt={book.title}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover' 
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '64px' }}>📚</span>
                        )}
                      </div>

                      <div style={{ padding: '16px' }}>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#1f2937',
                          margin: '0 0 8px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {book.title}
                        </h3>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#6b7280',
                          margin: '0 0 4px 0'
                        }}>
                          by {book.author}
                        </p>
                        {book.ISBN && (
                          <p style={{ 
                            fontSize: '12px', 
                            color: '#9ca3af',
                            margin: '0 0 8px 0'
                          }}>
                            ISBN: {book.ISBN}
                          </p>
                        )}
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginBottom: '12px',
                          flexWrap: 'wrap'
                        }}>
                          {book.category && (
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              fontSize: '12px',
                              borderRadius: '12px',
                              fontWeight: '500'
                            }}>
                              {book.category}
                            </span>
                          )}
                          {book.publicationYear && (
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: '#f3f4f6',
                              color: '#4b5563',
                              fontSize: '12px',
                              borderRadius: '12px'
                            }}>
                              {book.publicationYear}
                            </span>
                          )}
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px'
                        }}>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>
                            Available:
                          </span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '600',
                            color: book.availableCopies > 0 ? '#10b981' : '#dc2626'
                          }}>
                            {book.availableCopies}/{book.totalCopies}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{
                              flex: 1,
                              padding: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              backgroundColor: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #3b82f6',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleEditBook(book)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            style={{
                              flex: 1,
                              padding: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              backgroundColor: '#fef2f2',
                              color: '#991b1b',
                              border: '1px solid #dc2626',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleDeleteBook(book._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Book Tab */}
      {bookTab === 'edit' && editingBook && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '32px', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Edit Book
            </h2>

            {bookMessage.text && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: bookMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: bookMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${bookMessage.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
              }}>
                {bookMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateBook}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                  Book Cover Image
                </label>
                
                {editImagePreview && (
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={editImagePreview} 
                      alt="Book cover preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  style={{ display: 'none' }}
                  id="editBookCoverInput"
                />
                <label
                  htmlFor="editBookCoverInput"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginRight: '10px'
                  }}
                >
                  Change Image
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Book Title <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editBookForm.title}
                    onChange={handleEditBookFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    ISBN
                  </label>
                  <input
                    type="text"
                    name="ISBN"
                    value={editBookForm.ISBN}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Author <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={editBookForm.author}
                    onChange={handleEditBookFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editBookForm.category}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Publisher
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={editBookForm.publisher}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Publication Year
                  </label>
                  <input
                    type="number"
                    name="publicationYear"
                    value={editBookForm.publicationYear}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Volume
                  </label>
                  <input
                    type="text"
                    name="volume"
                    value={editBookForm.volume}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    name="shelfLocation"
                    value={editBookForm.shelfLocation}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Editions
                  </label>
                  <input
                    type="text"
                    name="editions"
                    value={editBookForm.editions}
                    onChange={handleEditBookFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Total Copies <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="totalCopies"
                    value={editBookForm.totalCopies}
                    onChange={handleEditBookFormChange}
                    required
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Available Copies <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="availableCopies"
                    value={editBookForm.availableCopies}
                    onChange={handleEditBookFormChange}
                    required
                    min="0"
                    max={editBookForm.totalCopies}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={bookLoading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    color: 'white',
                    backgroundColor: bookLoading ? '#9ca3af' : '#3b82f6',
                    border: 'none',
                    cursor: bookLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {bookLoading ? 'Updating...' : 'Update Book'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    color: '#6b7280',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookSection;