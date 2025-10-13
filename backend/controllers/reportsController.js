// backend/controllers/reportsController.js
const Book = require("../models/book");
const Student = require("../models/student");
const BorrowedRequest = require("../models/borrowedRequest");

/**
 * Get most borrowed books
 */
exports.getMostBorrowedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const mostBorrowed = await BorrowedRequest.aggregate([
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
 */
exports.getOverdueBooks = async (req, res) => {
  try {
    const now = new Date();
    const approvedRequests = await BorrowedRequest.find({ status: "approved" })
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

    const topBorrowers = await BorrowedRequest.aggregate([
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
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await BorrowedRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
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
    const allReturned = await BorrowedRequest.find({ 
      status: "returned",
      lateFee: { $gt: 0 }
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
    const totalBooks = await Book.countDocuments({ isDeleted: false });
    const totalStudents = await Student.countDocuments();
    const totalBorrows = await BorrowedRequest.countDocuments();
    const activeBorrows = await BorrowedRequest.countDocuments({ status: "approved" });
    const totalReturned = await BorrowedRequest.countDocuments({ status: "returned" });

    // Category breakdown
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