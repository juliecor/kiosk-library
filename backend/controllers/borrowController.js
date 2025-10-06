// controllers/borrowController.js
const BorrowedRequest = require("../models/BorrowedRequest");
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

    request.status = "approved";
    request.borrowDate = new Date();
    await request.save();

    await Book.findByIdAndUpdate(request.book._id, { $inc: { availableCopies: -1 } });

    // SMS sending
    let smsSent = false;
    try {
      if (request.student?.contactNumber) {
        const borrowDateStr = request.borrowDate.toLocaleString();
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Hi ${request.student.firstName}, your borrow request for "${request.book.title}" has been APPROVED. Borrowed: ${borrowDateStr}.`
          }
        });
        smsSent = true;
        console.log("Approval SMS sent successfully");
      }
    } catch (err) {
      console.error("SMS failed to send:", err.message);
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

    // SMS sending
    let smsSent = false;
    try {
      if (request.student?.contactNumber) {
        const deniedDateStr = new Date().toLocaleString();
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Sorry ${request.student.firstName}, your borrow request for "${request.book.title}" has been DENIED. Date: ${deniedDateStr}.`
          }
        });
        smsSent = true;
        console.log("Denial SMS sent successfully");
      }
    } catch (err) {
      console.error("SMS failed to send:", err.message);
    }

    res.json({ success: true, message: "Request denied", request, smsStatus: smsSent ? "sent" : "failed" });
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
    const request = await BorrowedRequest.findById(req.params.id).populate("student book");

    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = "returned";
    request.returnDate = new Date();

    const dueDate = new Date(request.borrowDate || request.createdAt);
    dueDate.setDate(dueDate.getDate() + 1);
    const now = new Date();

    if (now > dueDate) {
      const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      request.lateFee = daysLate * 5; // PHP 5 per day
    } else {
      request.lateFee = 0;
    }

    await request.save();

    await Book.findByIdAndUpdate(request.book._id, { $inc: { availableCopies: 1 } });

    // SMS sending
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

    // SMS sending
    let smsSent = false;
    try {
      if (request.student?.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Thank you ${request.student.firstName}, your late fee for "${request.book.title}" has been PAID.`
          }
        });
        smsSent = true;
        console.log("Payment confirmation SMS sent successfully");
      }
    } catch (err) {
      console.error("SMS failed to send:", err.message);
    }

    res.json({ success: true, message: "Late fee paid", request, smsStatus: smsSent ? "sent" : "failed" });
  } catch (error) {
    console.error("payLateFee error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
