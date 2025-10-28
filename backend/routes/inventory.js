const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const StockHistory = require('../models/stockHistory');
const BorrowedRequest = require('../models/borrowedRequest');
const Admin = require('../models/admin');
const auth = require('../middleware/auth');

// GET /api/inventory/stock-history
router.get('/stock-history', auth, async (req, res) => {
  try {
    const { filter, startDate, endDate, reason } = req.query;
    
    let query = {};
    
    // Filter by reason if provided
    if (reason && reason !== 'all') {
      query.reason = reason;
    }
    
    // Date filtering
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    } else if (filter === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query.createdAt = { $gte: oneWeekAgo };
    } else if (filter === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query.createdAt = { $gte: oneMonthAgo };
    }

    const history = await StockHistory.find(query)
      .sort({ createdAt: -1 })
      .populate('book', 'title author category')
      .populate('admin', 'fullName');

    res.json({
      success: true,
      history: history.map(item => ({
        _id: item._id,
        bookId: item.book._id,
        bookTitle: item.bookTitle,
        author: item.author,
        category: item.book?.category,
        action: item.action,
        quantity: item.quantity,
        reason: item.reason,
        notes: item.notes,
        previousAvailable: item.previousAvailable,
        previousTotal: item.previousTotal,
        newAvailable: item.newAvailable,
        newTotal: item.newTotal,
        date: item.createdAt,
        adminName: item.adminName,
        admin: item.admin?.fullName
      }))
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/inventory/repairs
router.get('/repairs', auth, async (req, res) => {
  try {
    const repairs = await StockHistory.find({ reason: 'repair' })
      .sort({ createdAt: -1 })
      .populate('book', 'title author category')
      .populate('admin', 'fullName');

    res.json({
      success: true,
      repairs: repairs.map(repair => ({
        _id: repair._id,
        bookTitle: repair.bookTitle,
        author: repair.author,
        category: repair.book?.category,
        quantity: repair.quantity,
        previousAvailable: repair.previousAvailable,
        newAvailable: repair.newAvailable,
        date: repair.createdAt,
        notes: repair.notes,
        adminName: repair.adminName
      }))
    });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/inventory/lost-books
router.get('/lost-books', auth, async (req, res) => {
  try {
    const lostBooks = await StockHistory.find({ reason: 'lost' })
      .sort({ createdAt: -1 })
      .populate('book', 'title author category publisher publicationYear')
      .populate('admin', 'fullName');

    // Also get lost books from BorrowedRequest for comprehensive view
    const borrowedLostBooks = await BorrowedRequest.find({ 
      bookCondition: 'lost',
      status: 'returned'
    })
    .populate('book', 'title author')
    .populate('student', 'firstName lastName studentId')
    .populate('assessedBy', 'fullName');

    const combinedLostBooks = lostBooks.map(lost => ({
      _id: lost._id,
      bookTitle: lost.bookTitle,
      author: lost.author,
      quantity: lost.quantity,
      previousTotal: lost.previousTotal,
      newTotal: lost.newTotal,
      date: lost.createdAt,
      notes: lost.notes,
      adminName: lost.adminName,
      paid: lost.paid,
      type: 'stock_adjustment'
    }));

    const borrowedLost = borrowedLostBooks.map(item => ({
      _id: item._id,
      bookTitle: item.book?.title,
      author: item.book?.author,
      studentName: item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Unknown Student',
      studentId: item.student?.studentId,
      quantity: 1,
      date: item.returnDate || item.updatedAt,
      replacementCost: item.damageFee || 0,
      paid: item.paid,
      assessedBy: item.assessedBy?.fullName,
      type: 'borrowed_lost'
    }));

    const allLostBooks = [...combinedLostBooks, ...borrowedLost].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      lostBooks: allLostBooks
    });
  } catch (error) {
    console.error('Error fetching lost books:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/inventory/stock-history
router.post('/stock-history', auth, async (req, res) => {
  try {
    const {
      bookId,
      bookTitle,
      author,
      action,
      quantity,
      reason,
      notes,
      previousAvailable,
      previousTotal,
      newAvailable,
      newTotal
    } = req.body;

    const stockHistory = new StockHistory({
      book: bookId,
      bookTitle,
      author,
      action,
      quantity,
      reason,
      notes,
      previousAvailable,
      previousTotal,
      newAvailable,
      newTotal,
      admin: req.admin.id,
      adminName: 'Library Admin' // ✅ Hardcode for now to test functionality
    });

    await stockHistory.save();
    
    res.json({
      success: true,
      message: 'Stock history recorded successfully'
    });
  } catch (error) {
    console.error('Error recording stock history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/inventory/damaged-books
router.get('/damaged-books', auth, async (req, res) => {
  try {
    // 1️⃣ Fetch damages from StockHistory
    const stockDamages = await StockHistory.find({ reason: 'damage' })
      .sort({ createdAt: -1 })
      .populate('book', 'title author category')
      .populate('admin', 'fullName');

    // 2️⃣ Fetch damages from BorrowedRequest
    const borrowedDamages = await BorrowedRequest.find({ 
      bookCondition: 'damaged',
      status: 'returned'
    })
    .sort({ returnDate: -1 })
    .populate('book', 'title author')
    .populate('student', 'firstName lastName studentId')
    .populate('assessedBy', 'fullName');

    // 3️⃣ Map StockHistory damage entries
    const stockDamageMapped = stockDamages.map(item => ({
      _id: item._id,
      bookTitle: item.bookTitle,
      author: item.author,
      category: item.book?.category,
      quantity: item.quantity,
      previousTotal: item.previousTotal,
      newTotal: item.newTotal,
      date: item.createdAt,
      notes: item.notes,
      adminName: item.adminName,
      type: 'stock_damage'
    }));

    // 4️⃣ Map BorrowedRequest damage entries
    const borrowedDamageMapped = borrowedDamages.map(item => ({
      _id: item._id,
      bookTitle: item.book?.title,
      author: item.book?.author,
      studentName: item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Unknown Student',
      studentId: item.student?.studentId,
      returnDate: item.returnDate,
      damageLevel: item.damageLevel,
      damageDescription: item.damageDescription,
      damageFee: item.damageFee,
      assessedBy: item.assessedBy?.fullName,
      type: 'borrowed_damage'
    }));

    // 5️⃣ Combine both sources
    const allDamagedBooks = [...stockDamageMapped, ...borrowedDamageMapped]
      .sort((a, b) => new Date(b.date || b.returnDate) - new Date(a.date || a.returnDate));

    res.json({
      success: true,
      damagedBooks: allDamagedBooks
    });
  } catch (error) {
    console.error('Error fetching damaged books:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;