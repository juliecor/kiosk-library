// backend/controllers/reportsController.js
const Book = require("../models/book");
const Student = require("../models/student");
const BorrowedRequest = require("../models/borrowedRequest");

// ✅ UNIFIED DATE FILTER HELPER
const getDateRangeFilter = (req) => {
  const { filter, startDate, endDate } = req.query;
  const now = new Date();
  let start, end = now;

  if (filter === "weekly") {
    start = new Date();
    start.setDate(now.getDate() - 7);
  } else if (filter === "monthly") {
    start = new Date();
    start.setMonth(now.getMonth() - 1);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // Return null for "all time" - no filter
    return null;
  }

  return { start, end };
};

// Helper to build date match for createdAt field
const buildCreatedAtMatch = (dateRange) => {
  if (!dateRange) return {};
  return {
    createdAt: {
      $gte: dateRange.start,
      $lte: dateRange.end
    }
  };
};

// Helper to build date match for returnDate field
const buildReturnDateMatch = (dateRange) => {
  if (!dateRange) return {};
  return {
    returnDate: {
      $gte: dateRange.start,
      $lte: dateRange.end
    }
  };
};

/**
 * Get most borrowed books
 */
exports.getMostBorrowedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildCreatedAtMatch(dateRange);

    const mostBorrowed = await BorrowedRequest.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$book",
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: limit }
    ]);

    const bookIds = mostBorrowed.map(item => item._id);
    const books = await Book.find({ _id: { $in: bookIds } });

    const result = mostBorrowed.map(item => {
      const book = books.find(b => b._id.toString() === item._id.toString());
      return {
        book,
        borrowCount: item.borrowCount
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getMostBorrowedBooks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get overdue books report
 * ✅ FIXED: Now supports date filtering
 */
exports.getOverdueBooks = async (req, res) => {
  try {
    const now = new Date();
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildCreatedAtMatch(dateRange);

    const approvedRequests = await BorrowedRequest.find({ 
      status: "approved",
      ...dateMatch
    })
      .populate("student", "firstName lastName studentId contactNumber email")
      .populate("book", "title author ISBN");

    const overdueBooks = [];

    approvedRequests.forEach(request => {
      const borrowDate = new Date(request.borrowDate || request.createdAt);
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + 1);

      if (now > dueDate) {
        const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
        const potentialFee = daysOverdue * 5;

        overdueBooks.push({
          requestId: request._id,
          student: request.student,
          book: request.book,
          borrowDate: request.borrowDate || request.createdAt,
          dueDate: dueDate,
          daysOverdue: daysOverdue,
          potentialFee: potentialFee
        });
      }
    });

    overdueBooks.sort((a, b) => b.daysOverdue - a.daysOverdue);

    res.json({ 
      success: true, 
      data: overdueBooks,
      totalOverdue: overdueBooks.length,
      totalPotentialFees: overdueBooks.reduce((sum, item) => sum + item.potentialFee, 0)
    });
  } catch (error) {
    console.error("getOverdueBooks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get top borrowers
 */
exports.getTopBorrowers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildCreatedAtMatch(dateRange);

    const topBorrowers = await BorrowedRequest.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$student",
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: limit }
    ]);

    const studentIds = topBorrowers.map(item => item._id);
    const students = await Student.find({ _id: { $in: studentIds } });

    const result = topBorrowers.map(item => {
      const student = students.find(s => s._id.toString() === item._id.toString());
      return {
        student,
        borrowCount: item.borrowCount
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getTopBorrowers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get borrowing trends (monthly)
 */
exports.getBorrowingTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const dateRange = getDateRangeFilter(req);
    
    let dateMatch;
    if (dateRange) {
      dateMatch = {
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      };
    } else {
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      dateMatch = { createdAt: { $gte: start } };
    }

    const trends = await BorrowedRequest.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalBorrows: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          returned: {
            $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] }
          },
          denied: {
            $sum: { $cond: [{ $eq: ["$status", "denied"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error("getBorrowingTrends error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get late fees summary
 */
exports.getLateFeesSummary = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const allReturned = await BorrowedRequest.find({ 
      status: "returned",
      lateFee: { $gt: 0 },
      ...dateMatch
    });

    const totalFees = allReturned.reduce((sum, req) => sum + (req.lateFee || 0), 0);
    const paidFees = allReturned
      .filter(req => req.paid)
      .reduce((sum, req) => sum + (req.lateFee || 0), 0);
    const unpaidFees = totalFees - paidFees;

    res.json({
      success: true,
      data: {
        totalFees,
        paidFees,
        unpaidFees,
        totalTransactions: allReturned.length,
        paidTransactions: allReturned.filter(req => req.paid).length,
        unpaidTransactions: allReturned.filter(req => !req.paid).length
      }
    });
  } catch (error) {
    console.error("getLateFeesSummary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get comprehensive report summary
 */
exports.getReportSummary = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildCreatedAtMatch(dateRange);

    const totalBooks = await Book.countDocuments({ isDeleted: false });
    const totalStudents = await Student.countDocuments();
    const totalBorrows = await BorrowedRequest.countDocuments(dateMatch);
    const activeBorrows = await BorrowedRequest.countDocuments({ 
      status: "approved",
      ...dateMatch
    });
    const totalReturned = await BorrowedRequest.countDocuments({ 
      status: "returned",
      ...dateMatch
    });

    const categoryStats = await Book.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalBooks,
        totalStudents,
        totalBorrows,
        activeBorrows,
        totalReturned,
        categoryStats
      }
    });
  } catch (error) {
    console.error("getReportSummary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get comprehensive financial summary
 */
exports.getFinancialSummary = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const allReturned = await BorrowedRequest.find({ 
      status: "returned",
      ...dateMatch
    });

    let totalLateFees = 0;
    let totalDamageFees = 0;
    let totalLostBookFees = 0;
    let collectedLateFees = 0;
    let collectedDamageFees = 0;
    let collectedLostBookFees = 0;
    let unpaidLateFees = 0;
    let unpaidDamageFees = 0;

    allReturned.forEach(req => {
      const lateFee = req.lateFee || 0;
      const damageFee = req.damageFee || 0;
      
      totalLateFees += lateFee;
      totalDamageFees += damageFee;
      
      if (req.bookCondition === "lost") {
        totalLostBookFees += damageFee;
      }

      if (req.paid) {
        collectedLateFees += lateFee;
        collectedDamageFees += damageFee;
        if (req.bookCondition === "lost") {
          collectedLostBookFees += damageFee;
        }
      } else {
        unpaidLateFees += lateFee;
        unpaidDamageFees += damageFee;
      }
    });

    const totalCollected = collectedLateFees + collectedDamageFees;
    const totalUnpaid = unpaidLateFees + unpaidDamageFees;

    res.json({
      success: true,
      data: {
        totalCollected,
        totalUnpaid,
        totalLateFees,
        totalDamageFees,
        totalLostBookFees,
        collectedLateFees,
        collectedDamageFees,
        collectedLostBookFees,
        unpaidLateFees,
        unpaidDamageFees
      }
    });
  } catch (error) {
    console.error("getFinancialSummary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get book condition report
 */
exports.getBookConditionReport = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const allReturned = await BorrowedRequest.find({ 
      status: "returned",
      ...dateMatch
    });

    const goodCount = allReturned.filter(r => r.bookCondition === "good").length;
    const damagedCount = allReturned.filter(r => r.bookCondition === "damaged").length;
    const lostCount = allReturned.filter(r => r.bookCondition === "lost").length;
    const total = allReturned.length;

    const totalDamageCost = allReturned
      .filter(r => r.bookCondition === "damaged" || r.bookCondition === "lost")
      .reduce((sum, r) => sum + (r.damageFee || 0), 0);

    res.json({
      success: true,
      data: {
        goodCount,
        damagedCount,
        lostCount,
        totalReturned: total,
        goodPercentage: total > 0 ? ((goodCount / total) * 100).toFixed(1) : 0,
        damagedPercentage: total > 0 ? ((damagedCount / total) * 100).toFixed(1) : 0,
        lostPercentage: total > 0 ? ((lostCount / total) * 100).toFixed(1) : 0,
        totalDamageCost
      }
    });
  } catch (error) {
    console.error("getBookConditionReport error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get damaged books list
 */
exports.getDamagedBooks = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const damagedBooks = await BorrowedRequest.find({ 
      status: "returned",
      bookCondition: "damaged",
      ...dateMatch
    })
    .populate("student", "firstName lastName studentId")
    .populate("book", "title author")
    .sort({ returnDate: -1 });

    const result = damagedBooks.map(req => ({
      bookTitle: req.book?.title || "Unknown",
      author: req.book?.author || "Unknown",
      studentName: `${req.student?.firstName || ""} ${req.student?.lastName || ""}`.trim(),
      studentId: req.student?.studentId || "Unknown",
      returnDate: req.returnDate,
      damageLevel: req.damageLevel || "unknown",
      damageDescription: req.damageDescription || "No description",
      damageFee: req.damageFee || 0,
      totalFee: (req.lateFee || 0) + (req.damageFee || 0),
      paid: req.paid || false
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getDamagedBooks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get lost books list
 */
exports.getLostBooks = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const lostBooks = await BorrowedRequest.find({ 
      status: "returned",
      bookCondition: "lost",
      ...dateMatch
    })
    .populate("student", "firstName lastName studentId")
    .populate("book", "title author")
    .sort({ returnDate: -1 });

    const result = lostBooks.map(req => ({
      bookTitle: req.book?.title || "Unknown",
      author: req.book?.author || "Unknown",
      studentName: `${req.student?.firstName || ""} ${req.student?.lastName || ""}`.trim(),
      studentId: req.student?.studentId || "Unknown",
      lostDate: req.returnDate,
      replacementCost: req.totalFee || req.damageFee || 0,
      damageFee: req.damageFee || 0,
      totalFee: (req.lateFee || 0) + (req.damageFee || 0),
      paid: req.paid || false
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getLostBooks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get students with outstanding fees
 */
exports.getStudentsWithFees = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const unpaidRequests = await BorrowedRequest.find({ 
      status: "returned",
      paid: false,
      $or: [
        { lateFee: { $gt: 0 } },
        { damageFee: { $gt: 0 } }
      ],
      ...dateMatch
    })
    .populate("student", "firstName lastName studentId course");

    const studentFeesMap = {};
    
    unpaidRequests.forEach(req => {
      const studentId = req.student?.studentId || "Unknown";
      const studentName = `${req.student?.firstName || ""} ${req.student?.lastName || ""}`.trim();
      
      if (!studentFeesMap[studentId]) {
        studentFeesMap[studentId] = {
          studentId,
          studentName,
          lateFee: 0,
          damageFee: 0,
          totalDue: 0
        };
      }
      
      studentFeesMap[studentId].lateFee += req.lateFee || 0;
      studentFeesMap[studentId].damageFee += req.damageFee || 0;
      studentFeesMap[studentId].totalDue += (req.lateFee || 0) + (req.damageFee || 0);
    });

    const result = Object.values(studentFeesMap).sort((a, b) => b.totalDue - a.totalDue);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getStudentsWithFees error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get damage analysis breakdown
 */
exports.getDamageAnalysis = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const damagedBooks = await BorrowedRequest.find({ 
      status: "returned",
      bookCondition: "damaged",
      ...dateMatch
    });

    const minorDamages = damagedBooks.filter(r => r.damageLevel === "minor");
    const moderateDamages = damagedBooks.filter(r => r.damageLevel === "moderate");
    const severeDamages = damagedBooks.filter(r => r.damageLevel === "severe");

    const minorCost = minorDamages.reduce((sum, r) => sum + (r.damageFee || 0), 0);
    const moderateCost = moderateDamages.reduce((sum, r) => sum + (r.damageFee || 0), 0);
    const severeCost = severeDamages.reduce((sum, r) => sum + (r.damageFee || 0), 0);

    res.json({
      success: true,
      data: {
        minorCount: minorDamages.length,
        moderateCount: moderateDamages.length,
        severeCount: severeDamages.length,
        minorCost,
        moderateCost,
        severeCost,
        totalCost: minorCost + moderateCost + severeCost,
        totalDamaged: damagedBooks.length
      }
    });
  } catch (error) {
    console.error("getDamageAnalysis error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get report summary by range (weekly, monthly, or custom)
 */
exports.getSummaryByRange = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    
    let start, end;
    if (dateRange) {
      start = dateRange.start;
      end = dateRange.end;
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    const dateFilter = {
      createdAt: {
        $gte: start,
        $lte: end
      }
    };

    const totalBorrows = await BorrowedRequest.countDocuments(dateFilter);
    const totalReturned = await BorrowedRequest.countDocuments({
      status: "returned",
      ...dateFilter
    });
    const totalApproved = await BorrowedRequest.countDocuments({
      status: "approved",
      ...dateFilter
    });
    const totalDenied = await BorrowedRequest.countDocuments({
      status: "denied",
      ...dateFilter
    });

    const returnedWithFees = await BorrowedRequest.find({
      status: "returned",
      returnDate: { $gte: start, $lte: end }
    });

    const totalLateFees = returnedWithFees.reduce(
      (sum, req) => sum + (req.lateFee || 0),
      0
    );
    const totalDamageFees = returnedWithFees.reduce(
      (sum, req) => sum + (req.damageFee || 0),
      0
    );
    const totalCollected = returnedWithFees
      .filter(req => req.paid)
      .reduce((sum, req) => sum + (req.lateFee || 0) + (req.damageFee || 0), 0);

    const response = {
      success: true,
      data: {
        range: req.query.filter || "custom",
        startDate: start,
        endDate: end,
        totalBorrows,
        totalReturned,
        totalApproved,
        totalDenied,
        totalLateFees,
        totalDamageFees,
        totalCollected
      }
    };

    res.json(response);
  } catch (error) {
    console.error("getSummaryByRange error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 
/**
 * Get returned books report (weekly / monthly / custom)
 */
exports.getReturnedBooksReport = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    
    let start, end;
    if (dateRange) {
      start = dateRange.start;
      end = dateRange.end;
    } else {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    const matchStage = {
      status: "returned",
      returnDate: { $gte: start, $lte: end }
    };

    const returnedBooks = await BorrowedRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$returnDate" },
            month: { $month: "$returnDate" },
            day: { $dayOfMonth: "$returnDate" }
          },
          totalReturned: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const formatted = returnedBooks.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}-${item._id.day.toString().padStart(2, "0")}`,
      totalReturned: item.totalReturned
    }));

    res.json({
      success: true,
      data: formatted,
      range: req.query.filter || "custom",
      startDate: start,
      endDate: end,
      totalReturned: formatted.reduce((sum, i) => sum + i.totalReturned, 0)
    });
  } catch (error) {
    console.error("getReturnedBooksReport error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get payment transactions history
 */
exports.getPaymentTransactions = async (req, res) => {
  try {
    const dateRange = getDateRangeFilter(req);
    const dateMatch = buildReturnDateMatch(dateRange);

    const paidTransactions = await BorrowedRequest.find({
      status: "returned",
      paid: true,
      $or: [
        { lateFee: { $gt: 0 } },
        { damageFee: { $gt: 0 } }
      ],
      ...dateMatch
    })
    .populate("student", "firstName lastName studentId")
    .populate("book", "title author")
    .sort({ returnDate: -1 });

    const result = paidTransactions.map(req => ({
      studentName: `${req.student?.firstName || ""} ${req.student?.lastName || ""}`.trim(),
      studentId: req.student?.studentId || "Unknown",
      bookTitle: req.book?.title || "Unknown",
      author: req.book?.author || "Unknown",
      borrowDate: req.borrowDate || req.createdAt,
      returnDate: req.returnDate,
      lateFee: req.lateFee || 0,
      damageFee: req.damageFee || 0,
      totalPaid: (req.lateFee || 0) + (req.damageFee || 0),
      bookCondition: req.bookCondition || "good",
      damageLevel: req.damageLevel || null,
      paymentDate: req.returnDate
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getPaymentTransactions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};