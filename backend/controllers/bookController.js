// backend/controllers/bookController.js
const Book = require("../models/book");

/**
 * Create a new book
 */
exports.createBook = async (req, res) => {
  try {
    const { 
      title, 
      author, 
      ISBN, 
      category, 
      volume, 
      publisher, 
      publicationYear, 
      shelfLocation, 
      editions,
      totalCopies,
      availableCopies
    } = req.body;

    // if an image is uploaded, multer gives us req.file
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newBook = new Book({
      title,
      author,
      ISBN,
      category,
      volume,
      publisher,
      publicationYear,
      shelfLocation,
      editions: editions ? editions.split(',').map(e => e.trim()).filter(e => e) : [],
      coverImage: imagePath, // Changed from 'image' to 'coverImage' to match model
      totalCopies: parseInt(totalCopies) || 1,
      availableCopies: parseInt(availableCopies) || 1,
      status: "available",
    });

    await newBook.save();
    res.status(201).json({ success: true, message: "Book added successfully", book: newBook });
  } catch (error) {
    console.error("createBook error:", error);
    
    // Handle duplicate ISBN error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A book with this ISBN already exists" });
    }
    
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Update book
 */
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      author, 
      ISBN, 
      category, 
      volume, 
      publisher, 
      publicationYear, 
      shelfLocation, 
      editions,
      totalCopies,
      availableCopies
    } = req.body;

    // if an image is uploaded, multer gives us req.file
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedFields = {
      title,
      author,
      ISBN,
      category,
      volume,
      publisher,
      publicationYear,
      shelfLocation,
    };

    // Handle editions
    if (editions) {
      updatedFields.editions = editions.split(',').map(e => e.trim()).filter(e => e);
    }

    // Handle copies
    if (totalCopies) {
      updatedFields.totalCopies = parseInt(totalCopies);
    }
    if (availableCopies !== undefined) {
      updatedFields.availableCopies = parseInt(availableCopies);
    }

    // only update image if new one was uploaded
    if (imagePath) {
      updatedFields.coverImage = imagePath; // Changed from 'image' to 'coverImage'
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book updated successfully", book: updatedBook });
  } catch (error) {
    console.error("updateBook error:", error);
    
    // Handle duplicate ISBN error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A book with this ISBN already exists" });
    }
    
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Get all books
 */
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, books });
  } catch (error) {
    console.error("getBooks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get single book
 */
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book || book.isDeleted) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, book });
  } catch (error) {
    console.error("getBookById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Soft delete book
 */
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    console.error("deleteBook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Restore soft-deleted book
 */
exports.restoreBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book restored successfully" });
  } catch (error) {
    console.error("restoreBook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};