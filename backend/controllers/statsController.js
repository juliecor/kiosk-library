// backend/controllers/statsController.js
const Book = require("../models/book");
const Student = require("../models/student");
const BorrowedRequest = require("../models/borrowedRequest");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ isDeleted: false });
    const totalStudents = await Student.countDocuments();
    const pendingRequests = await BorrowedRequest.countDocuments({ status: "pending" });
    const activeBorrows = await BorrowedRequest.countDocuments({ status: "approved" });

    const now = new Date();
    const approvedRequests = await BorrowedRequest.find({ status: "approved" });
    let overdueCount = 0;
    
    approvedRequests.forEach(request => {
      const borrowDate = new Date(request.borrowDate || request.createdAt);
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + 1);
      
      if (now > dueDate) {
        overdueCount++;
      }
    });

    const unpaidFees = await BorrowedRequest.find({ 
      status: "returned", 
      lateFee: { $gt: 0 },
      paid: { $ne: true }
    });
    
    const totalLateFees = unpaidFees.reduce((sum, req) => sum + (req.lateFee || 0), 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReturns = await BorrowedRequest.countDocuments({
      status: "returned",
      returnDate: { $gte: sevenDaysAgo }
    });

    const allBooks = await Book.find({ isDeleted: false });
    const totalCopies = allBooks.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableCopies = allBooks.reduce((sum, book) => sum + book.availableCopies, 0);
    const borrowedCopies = totalCopies - availableCopies;

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalStudents,
        pendingRequests,
        activeBorrows,
        overdueCount,
        totalLateFees,
        recentReturns,
        totalCopies,
        availableCopies,
        borrowedCopies
      }
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const recentActivity = await BorrowedRequest.find()
      .populate("student", "firstName lastName studentId")
      .populate("book", "title")
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({ success: true, activity: recentActivity });
  } catch (error) {
    console.error("getRecentActivity error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPopularBooks = async (req, res) => {
  try {
    const popularBooks = await BorrowedRequest.aggregate([
      {
        $group: {
          _id: "$book",
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 }
    ]);

    const bookIds = popularBooks.map(item => item._id);
    const books = await Book.find({ _id: { $in: bookIds } });

    const result = popularBooks.map(item => {
      const book = books.find(b => b._id.toString() === item._id.toString());
      return {
        book: book,
        borrowCount: item.borrowCount
      };
    });

    res.json({ success: true, popularBooks: result });
  } catch (error) {
    console.error("getPopularBooks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};