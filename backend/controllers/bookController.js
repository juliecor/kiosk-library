// backend/controllers/bookController.js
const Book = require("../models/book");

/**
 * Create a new book
 */
exports.createBook = async (req, res) => {
  try {
    const { 
      title, author, ISBN, category, volume, publisher, 
      publicationYear, shelfLocation, editions,
      totalCopies, availableCopies, description
    } = req.body;

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
      coverImage: imagePath,
      totalCopies: parseInt(totalCopies) || 1,
      availableCopies: parseInt(availableCopies) || 1,
      status: "available",
      description
    });

    await newBook.save();
    res.status(201).json({ success: true, message: "Book added successfully", book: newBook });
  } catch (error) {
    console.error("createBook error:", error);
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
      title, author, ISBN, category, volume, publisher, 
      publicationYear, shelfLocation, editions,
      totalCopies, availableCopies, description
    } = req.body;

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
      description
    };

    if (editions) {
      updatedFields.editions = editions.split(',').map(e => e.trim()).filter(e => e);
    }
    if (totalCopies) updatedFields.totalCopies = parseInt(totalCopies);
    if (availableCopies !== undefined) updatedFields.availableCopies = parseInt(availableCopies);
    if (imagePath) updatedFields.coverImage = imagePath;

    const updatedBook = await Book.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book updated successfully", book: updatedBook });
  } catch (error) {
    console.error("updateBook error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A book with this ISBN already exists" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Get all books (with filters and pagination)
 */
exports.getBooks = async (req, res) => {
  try {
    const { search, category, shelfLocation, publicationYear, status, page = 1, limit = 50 } = req.query;
    
    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50)); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false };

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { ISBN: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Shelf location filter
    if (shelfLocation) {
      filter.shelfLocation = shelfLocation;
    }

    // Publication year filter
    if (publicationYear) {
      filter.publicationYear = parseInt(publicationYear);
    }

    // Status filter for inventory view
    if (status === "low-stock") {
      // Available copies > 0 and <= 3
      filter.availableCopies = { $gt: 0, $lte: 3 };
    } else if (status === "out-of-stock") {
      // Available copies = 0
      filter.availableCopies = 0;
    } else if (status === "available") {
      // Available copies > 3
      filter.availableCopies = { $gt: 3 };
    } else if (status === "borrowed") {
      // Has borrowed copies (totalCopies > availableCopies)
      filter.$expr = { $lt: ["$availableCopies", "$totalCopies"] };
    }

    // Execute query
    const books = await Book.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Book.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("getBooks error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
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
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    res.json({ success: true, message: "Book restored successfully" });
  } catch (error) {
    console.error("restoreBook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// In bookController.js - CORRECTED adjustStock function

exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason, notes } = req.body;

    // Validation
    if (!type || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Type and quantity are required"
      });
    }

    if (type !== "add" && type !== "remove") {
      return res.status(400).json({
        success: false,
        message: "Type must be 'add' or 'remove'"
      });
    }

    const adjustQty = Math.max(1, parseInt(quantity) || 1);
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    console.log("📦 Adjustment Request:");
    console.log("   Book:", book.title);
    console.log("   Current - Total:", book.totalCopies, "Available:", book.availableCopies);
    console.log("   Action:", type, quantity, "Reason:", reason);

    let newAvailable = book.availableCopies;
    let newTotal = book.totalCopies;

    if (type === "add") {
      // ADDING copies back
      if (reason === "repair") {
        // Repairing a damaged book
        // The book was out of circulation, now it's fixed
        // Only increase available, total stays same
        console.log("✅ REPAIR: Damaged book being fixed");
        newAvailable += adjustQty;
        // newTotal stays same (you still own the same number of copies)
        
      } else if (reason === "new-purchase" || reason === "new purchase") {
        // New books being added to inventory
        console.log("✅ NEW PURCHASE: Adding new books");
        newAvailable += adjustQty;
        newTotal += adjustQty;
        
      } else {
        // Generic "other" add - assume new books
        console.log("✅ ADD OTHER: Adding copies");
        newAvailable += adjustQty;
        newTotal += adjustQty;
      }

    } else if (type === "remove") {
      // REMOVING copies
      if (reason === "damaged" || reason === "destroyed") {
        // Permanently removing damaged/destroyed books from inventory
        // Check if we have enough total copies
        console.log("❌ DAMAGED/DESTROYED: Permanently removing");
        
        if (adjustQty > book.totalCopies) {
          return res.status(400).json({
            success: false,
            message: `Cannot remove ${adjustQty} copies. Only ${book.totalCopies} total copies exist.`
          });
        }
        
        newTotal -= adjustQty;
        newAvailable = Math.max(0, newAvailable - adjustQty);
        
      } else if (reason === "lost") {
        // Lost books - permanently remove
        console.log("❌ LOST: Permanently removing");
        
        if (adjustQty > book.totalCopies) {
          return res.status(400).json({
            success: false,
            message: `Cannot remove ${adjustQty} copies. Only ${book.totalCopies} total copies exist.`
          });
        }
        
        newTotal -= adjustQty;
        newAvailable = Math.max(0, newAvailable - adjustQty);
        
      } else {
        // Generic correction - just adjust available
        console.log("⚠️ CORRECTION: Adjusting available copies");
        
        if (adjustQty > book.availableCopies) {
          return res.status(400).json({
            success: false,
            message: `Cannot remove ${adjustQty} copies. Only ${book.availableCopies} available.`
          });
        }
        
        newAvailable -= adjustQty;
      }
    }

    // Final validations
    if (newAvailable < 0) {
      return res.status(400).json({
        success: false,
        message: "Adjustment would result in negative available copies"
      });
    }

    if (newTotal < 0) {
      return res.status(400).json({
        success: false,
        message: "Adjustment would result in negative total copies"
      });
    }

    if (newAvailable > newTotal) {
      console.log("❌ VALIDATION ERROR: Available exceeds Total");
      console.log("   Available:", newAvailable, "Total:", newTotal);
      return res.status(400).json({
        success: false,
        message: `Available copies (${newAvailable}) cannot exceed total copies (${newTotal})`
      });
    }

    console.log("✅ Validation passed");
    console.log("   New - Total:", newTotal, "Available:", newAvailable);

    // Update the book
    const updateData = {
      availableCopies: newAvailable,
      totalCopies: newTotal
    };

    // Add adjustment history note to description
    if (notes) {
      const timestamp = new Date().toLocaleString();
      const adjustmentLog = `\n[${timestamp}] ${type.toUpperCase()} ${adjustQty} (${reason}): ${notes}`;
      updateData.description = (book.description || "") + adjustmentLog;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });

    console.log("✅ Book updated successfully");
    console.log("   Result - Total:", updatedBook.totalCopies, "Available:", updatedBook.availableCopies);

    res.json({
      success: true,
      message: `Stock adjusted successfully (${type}: ${adjustQty})`,
      book: updatedBook,
      adjustment: {
        type,
        quantity: adjustQty,
        reason,
        before: {
          available: book.availableCopies,
          total: book.totalCopies
        },
        after: {
          available: updatedBook.availableCopies,
          total: updatedBook.totalCopies
        }
      }
    });
  } catch (error) {
    console.error("adjustStock error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Get inventory statistics and alerts
 */
exports.getInventoryStats = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    const totalBooks = await Book.countDocuments(filter);
    const totalCopies = await Book.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$totalCopies" } } }
    ]);
    const availableCopies = await Book.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$availableCopies" } } }
    ]);

    const lowStockBooks = await Book.find({
      ...filter,
      availableCopies: { $gt: 0, $lte: 3 }
    }).select("_id title availableCopies totalCopies");

    const outOfStockBooks = await Book.find({
      ...filter,
      availableCopies: 0
    }).select("_id title totalCopies");

    const totalCopiesCount = totalCopies.length > 0 ? totalCopies[0].total : 0;
    const availableCopiesCount = availableCopies.length > 0 ? availableCopies[0].total : 0;
    const borrowedCopiesCount = totalCopiesCount - availableCopiesCount;

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalCopies: totalCopiesCount,
        availableCopies: availableCopiesCount,
        borrowedCopies: borrowedCopiesCount,
        borrowPercentage: totalCopiesCount > 0 ? ((borrowedCopiesCount / totalCopiesCount) * 100).toFixed(2) : 0,
        lowStockCount: lowStockBooks.length,
        outOfStockCount: outOfStockBooks.length,
        lowStockBooks,
        outOfStockBooks
      }
    });
  } catch (error) {
    console.error("getInventoryStats error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};