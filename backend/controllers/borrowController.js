// controllers/borrowController.js
const BorrowedRequest = require("../models/borrowedRequest");
const Student = require("../models/student");
const Book = require("../models/book");
const axios = require("axios");

const SMS_GATEWAY_URL = "http://192.168.1.2:8080/send";

// ==========================
// CREATE BORROW REQUEST
// ==========================
exports.createBorrowRequest = async (req, res) => {
  try {
    const { studentId, bookId } = req.body;

    if (!studentId || !bookId) {
      return res.status(400).json({ success: false, message: "Missing studentId or bookId" });
    }

    const student = await Student.findOne({ studentId });
    const book = await Book.findById(bookId);

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    if (book.availableCopies <= 0) return res.status(400).json({ success: false, message: "No copies available" });

    // ✅ CHECK IF STUDENT HAS AN UNRETURNED BOOK
    const unreturnedBook = await BorrowedRequest.findOne({
      student: student._id,
      status: { $in: ["approved", "pending"] }, // Check both approved and pending requests
      returnDate: null
    }).populate("book");

    if (unreturnedBook) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot borrow. You must return "${unreturnedBook.book.title}" first before borrowing another book.`,
        currentBook: unreturnedBook.book.title
      });
    }

    const request = await BorrowedRequest.create({
      student: student._id,
      book: book._id,
      status: "pending",
    });

    res.json({ success: true, message: "Borrow request created", request });
  } catch (error) {
    console.error("createBorrowRequest error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// GET ALL REQUESTS
// ==========================
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BorrowedRequest.find()
      .populate("student")
      .populate("book")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error("getAllRequests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// APPROVE REQUEST
// ==========================
exports.approveRequest = async (req, res) => {
  try {
    const request = await BorrowedRequest.findById(req.params.id).populate("student book");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    // ✅ DOUBLE-CHECK BEFORE APPROVAL: Student shouldn't have another approved book
    const existingBorrow = await BorrowedRequest.findOne({
      student: request.student._id,
      status: "approved",
      returnDate: null,
      _id: { $ne: request._id } // Exclude current request
    }).populate("book");

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Student already has an unreturned book: "${existingBorrow.book.title}"`,
        existingBook: existingBorrow.book.title
      });
    }

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 1);

    request.status = "approved";
    request.borrowDate = now;
    request.dueDate = dueDate;
    await request.save();

    await Book.findByIdAndUpdate(request.book._id, { $inc: { availableCopies: -1 } });

    // SMS sending
    let smsSent = false;
    try {
      if (request.student?.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Hi ${request.student.firstName}, your borrow request for "${request.book.title}" has been APPROVED. Due Date: ${dueDate.toLocaleString()}.`
          }
        });
        smsSent = true;
      }
    } catch (err) {
      console.error("SMS failed:", err.message);
    }

    res.json({ success: true, message: "Request approved", request, smsStatus: smsSent ? "sent" : "failed" });
  } catch (error) {
    console.error("approveRequest error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// DENY REQUEST
// ==========================
exports.denyRequest = async (req, res) => {
  try {
    const request = await BorrowedRequest.findById(req.params.id).populate("student book");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = "denied";
    await request.save();

    // SMS
    try {
      if (request.student?.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Sorry ${request.student.firstName}, your borrow request for "${request.book.title}" has been DENIED.`
          }
        });
      }
    } catch (err) {
      console.error("SMS failed:", err.message);
    }

    res.json({ success: true, message: "Request denied", request });
  } catch (error) {
    console.error("denyRequest error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// RETURN BOOK
// ==========================
exports.returnBook = async (req, res) => {
  try {
    console.log("📦 Return request body:", JSON.stringify(req.body, null, 2));
    console.log("📋 Request ID:", req.params.id);

    const { bookCondition } = req.body;

    if (!bookCondition) {
      return res.status(400).json({ 
        success: false, 
        message: "Book condition is required" 
      });
    }

    const request = await BorrowedRequest.findById(req.params.id)
      .populate("student")
      .populate("book");

    if (!request) {
      console.error("❌ Request not found:", req.params.id);
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!request.book) {
      console.error("❌ Book not found in request:", request._id);
      return res.status(404).json({ success: false, message: "Book not found in request" });
    }

    console.log("✅ Request found:", request._id);
    console.log("✅ Book found:", request.book.title);
    console.log("✅ Student found:", request.student?.firstName);

    const now = new Date();
    const dueDate = request.dueDate ? new Date(request.dueDate) : new Date(request.borrowDate);
    const isLate = now > dueDate;

    request.status = "returned";
    request.returnDate = now;
    request.bookCondition = bookCondition.toLowerCase().trim();
    request.isLate = isLate;

    if (isLate) {
      const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      request.lateFee = daysLate * 5;
    } else {
      request.lateFee = 0;
    }

    console.log("💾 Saving request with condition:", request.bookCondition);
    await request.save();
    console.log("✅ Request saved successfully");

    // ✅ Update book inventory based on condition
    const bookId = request.book._id;
    const cond = bookCondition.toLowerCase().trim();
    
    console.log("🔍 Processing condition:", cond);
    console.log("📚 Updating book ID:", bookId);
    
    if (cond === "good" || cond === "damaged") {
      console.log("✅ Incrementing availableCopies for book:", bookId);
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      console.log("✅ Book availableCopies incremented");
    } else if (cond === "lost") {
      console.log("❌ Decrementing totalCopies (book lost) for book:", bookId);
      await Book.findByIdAndUpdate(bookId, { $inc: { totalCopies: -1 } });
      console.log("✅ Book totalCopies decremented");
    } else {
      console.warn("⚠️ Unknown condition:", cond);
    }

    // ✅ SMS notification
    let smsSent = false;
    try {
      if (request.student?.contactNumber) {
        const borrowDateStr = request.borrowDate.toLocaleString();
        const returnDateStr = request.returnDate.toLocaleString();
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: "${request.book.title}" RETURNED. Borrowed: ${borrowDateStr}. Returned: ${returnDateStr}. Late fee: PHP ${request.lateFee}.`
          }
        });
        smsSent = true;
      }
    } catch (err) {
      console.error("SMS failed to send:", err.message);
    }

    res.json({ success: true, message: "Book marked as returned", request, smsStatus: smsSent ? "sent" : "failed" });
  } catch (error) {
    console.error("returnBook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// PAY LATE FEE
// ==========================
exports.payLateFee = async (req, res) => {
  try {
    const request = await BorrowedRequest.findById(req.params.id).populate("student book");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.lateFee = 0;
    request.paid = true;
    await request.save();

    // SMS
    try {
      if (request.student?.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Thank you ${request.student.firstName}, your late fee for "${request.book.title}" has been PAID.`
          }
        });
      }
    } catch (err) {
      console.error("SMS failed:", err.message);
    }

    res.json({ success: true, message: "Late fee paid", request });
  } catch (error) {
    console.error("payLateFee error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// CHECK STUDENT ELIGIBILITY (Optional - for frontend)
// ==========================
exports.checkBorrowEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const unreturnedBook = await BorrowedRequest.findOne({
      student: student._id,
      status: { $in: ["approved", "pending"] },
      returnDate: null
    }).populate("book");

    if (unreturnedBook) {
      return res.json({
        success: true,
        canBorrow: false,
        message: `Student has an unreturned book: "${unreturnedBook.book.title}"`,
        currentBook: {
          title: unreturnedBook.book.title,
          borrowDate: unreturnedBook.borrowDate,
          dueDate: unreturnedBook.dueDate,
          status: unreturnedBook.status
        }
      });
    }

    res.json({
      success: true,
      canBorrow: true,
      message: "Student can borrow a book"
    });

  } catch (error) {
    console.error("checkBorrowEligibility error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// MANUAL TEST OVERDUE (DEV)
// ==========================
exports.testOverdue = async (req, res) => {
  try {
    const request = await BorrowedRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5);
    request.dueDate = oldDate;
    await request.save();

    res.json({ success: true, message: "Due date manually set to 5 days ago", request });
  } catch (error) {
    console.error("testOverdue error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};