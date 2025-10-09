// controllers/borrowController.js
const BorrowedRequest = require("../models/borrowedRequest");
const Student = require("../models/student");
const Book = require("../models/book");
const axios = require("axios");

const SMS_GATEWAY_URL = "http://192.168.1.30:8080/send"; // ✅ your gateway endpoint

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

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 1); // ✅ due in 1 day

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
    const { condition } = req.body; // ✅ librarian sends book condition
    const request = await BorrowedRequest.findById(req.params.id).populate("student book");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    const now = new Date();
    const dueDate = request.dueDate ? new Date(request.dueDate) : new Date(request.borrowDate);
    const isLate = now > dueDate;

    request.status = "returned";
    request.returnDate = now;
    request.bookCondition = condition || "good";
    request.isLate = isLate;

    if (isLate) {
      const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      request.lateFee = daysLate * 5; // ₱5/day
    } else {
      request.lateFee = 0;
    }

    await request.save();

    // ✅ Only restock the book if it's not lost or damaged
    if (condition === "good") {
      await Book.findByIdAndUpdate(request.book._id, { $inc: { availableCopies: 1 } });
    } else if (condition === "lost") {
      await Book.findByIdAndUpdate(request.book._id, { $inc: { totalCopies: -1 } });
    }

    // SMS
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
        console.log("Return SMS sent successfully");
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
