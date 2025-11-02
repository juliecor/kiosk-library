// backend/controllers/borrowController.js
const BorrowedRequest = require("../models/borrowedRequest");
const Student = require("../models/student");
const Book = require("../models/book");
const StockHistory = require("../models/stockHistory");
const axios = require("axios");

const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL || "http://192.168.1.2:8080/send";

// ==========================
// TEMPORARY OTP STORAGE (Consider Redis for production)
// ==========================
const otpStore = new Map();
const otpRequestCount = new Map();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Cleanup old request counts every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of otpRequestCount.entries()) {
    const recent = timestamps.filter(time => now - time < 15 * 60 * 1000);
    if (recent.length === 0) {
      otpRequestCount.delete(key);
    } else {
      otpRequestCount.set(key, recent);
    }
  }
}, 30 * 60 * 1000);

// ==========================
// SEND OTP TO STUDENT
// ==========================
exports.sendOTP = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId)
      return res.status(400).json({ success: false, message: "Student ID is required" });

    // ✅ Rate Limiting: Max 3 OTPs per 15 minutes
    const now = Date.now();
    const requests = otpRequestCount.get(studentId) || [];
    const recentRequests = requests.filter(time => now - time < 15 * 60 * 1000);
    
    if (recentRequests.length >= 10) {
      return res.status(429).json({ 
        success: false, 
        message: "Too many OTP requests. Please wait 15 minutes before trying again." 
      });
    }

    const student = await Student.findOne({ studentId });
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    if (!student.contactNumber)
      return res.status(400).json({ 
        success: false, 
        message: "No contact number registered. Please contact the library to update your information." 
      });

    // ✅ Validate phone number format (basic check)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(student.contactNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid phone number format in your profile. Please contact the library." 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP temporarily (3 minutes)
    otpStore.set(studentId, { 
      otp, 
      expiresAt: Date.now() + 3 * 60 * 1000,
      attempts: 0 // Track verification attempts
    });

    // Update request count
    recentRequests.push(now);
    otpRequestCount.set(studentId, recentRequests);

    // ✅ Send via SMS with error handling
    try {
      await axios.get(SMS_GATEWAY_URL, {
        params: {
          to: student.contactNumber,
          message: `BENEDICTO COLLEGE LIBRARY: Your OTP code is ${otp}. It will expire in 3 minutes. Do not share this code.`
        },
        timeout: 10000 // 10 second timeout
      });
    } catch (smsError) {
      console.error("SMS Gateway Error:", smsError.message);
      otpStore.delete(studentId); // Remove OTP if SMS failed
      return res.status(503).json({ 
        success: false, 
        message: "Failed to send OTP. SMS service temporarily unavailable. Please try again." 
      });
    }

    // ✅ Log OTP activity for security audit
    console.log(`[OTP] Sent to student ${studentId} at ${new Date().toISOString()}`);

    res.json({ 
      success: true, 
      message: "OTP sent successfully to your registered mobile number",
      expiresIn: "3 minutes"
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
  }
};

// ==========================
// VERIFY OTP
// ==========================
exports.verifyOTP = async (req, res) => {
  try {
    const { studentId, otp } = req.body;

    if (!studentId || !otp)
      return res.status(400).json({ success: false, message: "Missing studentId or OTP" });

    // ✅ Sanitize OTP input
    const sanitizedOTP = otp.trim();
    if (!/^\d{6}$/.test(sanitizedOTP)) {
      return res.status(400).json({ success: false, message: "Invalid OTP format. Must be 6 digits." });
    }

    const record = otpStore.get(studentId);

    if (!record)
      return res.status(400).json({ success: false, message: "No OTP found or expired. Please request a new one." });

    // ✅ Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(studentId);
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    // ✅ Limit verification attempts (max 3)
    record.attempts = (record.attempts || 0) + 1;
    
    if (record.attempts > 3) {
      otpStore.delete(studentId);
      console.log(`[OTP] Too many failed attempts for student ${studentId}`);
      return res.status(400).json({ 
        success: false, 
        message: "Too many failed attempts. Please request a new OTP." 
      });
    }

    // ✅ Verify OTP
    if (record.otp !== sanitizedOTP) {
      otpStore.set(studentId, record); // Save updated attempt count
      const remainingAttempts = 3 - record.attempts;
      console.log(`[OTP] Invalid attempt for student ${studentId}. Remaining: ${remainingAttempts}`);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      });
    }

    // ✅ SUCCESS - Remove OTP after successful verification
    otpStore.delete(studentId);
    console.log(`[OTP] Successfully verified for student ${studentId}`);
    
    res.json({ 
      success: true, 
      message: "OTP verified successfully" 
    });
  } catch (error) {
    console.error("verifyOTP error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};
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
    
    // 🆕 CHECK STUDENT STATUS
    if (student.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact the library to activate your account.",
        status: "inactive"
      });
    }

    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    if (book.availableCopies <= 0) return res.status(400).json({ success: false, message: "No copies available" });

    const unreturnedBook = await BorrowedRequest.findOne({
      student: student._id,
      status: { $in: ["approved", "pending"] },
      returnDate: null
    }).populate("book");

    if (unreturnedBook) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot borrow. You must return "${unreturnedBook.book.title}" first before borrowing another book.`,
        currentBook: unreturnedBook.book.title
      });
    }

    // ✅ CREATE BORROW REQUEST
    const request = await BorrowedRequest.create({
      student: student._id,
      book: book._id,
      status: "pending",
    });

    // ✅ SEND SMS to student
    let smsSent = false;
    try {
      if (student?.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Hi ${student.firstName}, your borrow request for "${book.title}" has been submitted successfully. Please wait for admin approval.`
          }
        });
        smsSent = true;
      }
    } catch (err) {
      console.error("SMS failed:", err.message);
    }

    res.json({ 
      success: true, 
      message: "Borrow request created", 
      smsSent,
      request 
    });
    
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

    // 🆕 CHECK STUDENT STATUS - Before approving
    if (request.student.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: `Cannot approve. Student account is inactive.`,
        studentStatus: "inactive"
      });
    }

    const existingBorrow = await BorrowedRequest.findOne({
      student: request.student._id,
      status: "approved",
      returnDate: null,
      _id: { $ne: request._id }
    }).populate("book");

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Student already has an unreturned book: "${existingBorrow.book.title}"`,
        existingBook: existingBorrow.book.title
      });
    }

    // Pre-check: Make sure book has available copies
    const book = await Book.findById(request.book._id);
    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No copies available for this book"
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
// RETURN BOOK WITH STOCK HISTORY LOGGING - FIXED VERSION
// ==========================
exports.returnBook = async (req, res) => {
  try {
    console.log("📦 Return request body:", JSON.stringify(req.body, null, 2));
    console.log("📋 Request ID:", req.params.id);

    const { bookCondition, damageLevel, damageDescription, damageFee } = req.body;

    // Validation
    if (!bookCondition) {
      return res.status(400).json({ success: false, message: "Book condition is required" });
    }

    if (bookCondition === "damaged" && !damageDescription) {
      return res.status(400).json({ success: false, message: "Damage description is required for damaged books" });
    }

    const request = await BorrowedRequest.findById(req.params.id)
      .populate("student")
      .populate("book");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!request.book) {
      return res.status(404).json({ success: false, message: "Book not found in request" });
    }

    console.log("✅ Request found:", request._id);
    console.log("✅ Book found:", request.book.title);
    console.log("✅ Condition:", bookCondition);

    const now = new Date();
    const dueDate = request.dueDate ? new Date(request.dueDate) : new Date(request.borrowDate);
    const isLate = now > dueDate;

    // Calculate late fee
    let lateFee = 0;
    if (isLate) {
      const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      lateFee = daysLate * 5;
    }

    // Update request with all information
    request.status = "returned";
    request.returnDate = now;
    request.returnedAt = now;
    request.bookCondition = bookCondition.toLowerCase().trim();
    request.isLate = isLate;
    request.lateFee = lateFee;

    // ✅ FIXED DAMAGE FEE LOGIC
    if (bookCondition === "damaged") {
      request.damageLevel = damageLevel || "minor";
      request.damageDescription = damageDescription;
      request.damageFee = damageFee !== undefined ? damageFee : 75;
    } else if (bookCondition === "lost") {
      request.damageFee = damageFee !== undefined
        ? damageFee
        : (request.book.price ? request.book.price + 50 : 550);
      request.damageDescription = "Book lost by student";
    } else {
      request.damageFee = 0;
      request.damageLevel = null;
      request.damageDescription = null;
    }

    // Calculate total fee
    request.totalFee = request.lateFee + request.damageFee;

    console.log("💰 Fees calculated:");
    console.log("   Late Fee:", request.lateFee);
    console.log("   Damage Fee:", request.damageFee);
    console.log("   Total Fee:", request.totalFee);

    await request.save();
    console.log("✅ Request saved successfully");

    // ✅ FIXED INVENTORY LOGIC + Stock History
    const bookId = request.book._id;
    const cond = request.bookCondition;
    const book = await Book.findById(bookId); // Get current book state BEFORE changes

    if (cond === "good") {
      console.log("✅ [GOOD] Incrementing availableCopies for book:", bookId);
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      
    } else if (cond === "damaged") {
      console.log("⚠️ [DAMAGED] Book exists but not usable - ONLY decrementing availableCopies");
      
      // Capture BEFORE state
      const previousTotal = book.totalCopies;
      const previousAvailable = book.availableCopies;
      
      // ✅ FIXED: Only decrement availableCopies, NOT totalCopies
      // The book still physically exists, it's just not available for borrowing
      await Book.findByIdAndUpdate(bookId, { 
        $inc: { 
          availableCopies: book.availableCopies > 0 ? -1 : 0
        } 
      });
      
      // Create stock history entry
      try {
        await StockHistory.create({
          book: bookId,
          bookTitle: request.book.title,
          author: request.book.author,
          action: "remove",
          quantity: 1,
          reason: "damaged",
          notes: damageDescription || "Book returned in damaged condition - removed from circulation",
          previousAvailable: previousAvailable,
          previousTotal: previousTotal,
          newAvailable: Math.max(0, previousAvailable - 1),
          newTotal: previousTotal, // ✅ Total stays the same
          admin: req.admin._id,
          adminName: req.admin.fullName || "Library Admin"
        });
        console.log("✅ Stock history created for damaged book");
      } catch (historyError) {
        console.error("Failed to create stock history:", historyError);
      }
      
    } else if (cond === "lost") {
      console.log("❌ [LOST] Book is gone - Decrementing BOTH totalCopies and availableCopies");
      
      // Capture BEFORE state
      const previousTotal = book.totalCopies;
      const previousAvailable = book.availableCopies;
      
      // Update book inventory - lost books reduce both counts
      await Book.findByIdAndUpdate(bookId, { 
        $inc: { 
          totalCopies: -1,
          availableCopies: book.availableCopies > 0 ? -1 : 0
        } 
      });
      
      // Create stock history entry
      try {
        await StockHistory.create({
          book: bookId,
          bookTitle: request.book.title,
          author: request.book.author,
          action: "remove",
          quantity: 1,
          reason: "lost",
          notes: "Book reported as lost by student - permanently removed from inventory",
          previousAvailable: previousAvailable,
          previousTotal: previousTotal,
          newAvailable: Math.max(0, previousAvailable - 1),
          newTotal: previousTotal - 1,
          admin: req.admin._id,
          adminName: req.admin.fullName || "Library Admin"
        });
        console.log("✅ Stock history created for lost book");
      } catch (historyError) {
        console.error("Failed to create stock history:", historyError);
      }
    }

    // SMS Notification
    let smsSent = false;
    try {
      if (request.student?.contactNumber) {
        let smsMessage = `BENEDICTO COLLEGE LIBRARY: "${request.book.title}" RETURNED.\n`;

        if (cond === "damaged") {
          smsMessage += `Status: DAMAGED (${request.damageLevel})\n`;
          smsMessage += `Description: ${request.damageDescription}\n`;
        } else if (cond === "lost") {
          smsMessage += `Status: LOST - Replacement required\n`;
        } else {
          smsMessage += `Status: GOOD CONDITION\n`;
        }

        if (request.totalFee > 0) {
          smsMessage += `\nFEES DUE:\n`;
          if (request.lateFee > 0) {
            const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
            smsMessage += `- Late Fee: PHP ${request.lateFee} (${daysLate} days)\n`;
          }
          if (request.damageFee > 0) {
            if (cond === "damaged") {
              smsMessage += `- Damage Fee: PHP ${request.damageFee} (${request.damageLevel})\n`;
            } else if (cond === "lost") {
              smsMessage += `- Replacement Fee: PHP ${request.damageFee}\n`;
            }
          }
          smsMessage += `TOTAL: PHP ${request.totalFee}\n`;
          smsMessage += `Please pay at the library desk.`;
        } else {
          smsMessage += `No fees. Thank you!`;
        }

        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: smsMessage
          }
        });
        smsSent = true;
      }
    } catch (err) {
      console.error("SMS failed to send:", err.message);
    }

    res.json({
      success: true,
      message: `Book marked as returned (${bookCondition})`,
      request,
      smsStatus: smsSent ? "sent" : "failed",
      inventoryUpdate: {
        condition: cond,
        action:
          cond === "good"
            ? "availableCopies +1 (returned to circulation)"
            : cond === "damaged"
            ? "availableCopies -1 (removed from circulation, book still exists)" // ✅ Updated message
            : "totalCopies -1, availableCopies -1 (permanently lost)"
      },
      fees: {
        lateFee: request.lateFee,
        damageFee: request.damageFee,
        totalFee: request.totalFee
      }
    });
  } catch (error) {
    console.error("returnBook error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
// ==========================
// PAY FEE
// ==========================
exports.payLateFee = async (req, res) => {
  try {
    const request = await BorrowedRequest.findById(req.params.id).populate("student book");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    const totalPaid = request.totalFee;

    request.paid = true;
    await request.save();

    try {
      if (request.student?.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: request.student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Thank you ${request.student.firstName}! Payment of PHP ${totalPaid} received for "${request.book.title}". All fees cleared.`
          }
        });
      }
    } catch (err) {
      console.error("SMS failed:", err.message);
    }

    res.json({
      success: true,
      message: "Fees marked as paid successfully",
      request,
      amountPaid: totalPaid
    });
  } catch (error) {
    console.error("payLateFee error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// CHECK STUDENT ELIGIBILITY
// ==========================
exports.checkBorrowEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // 🆕 CHECK STUDENT STATUS - Added to eligibility check
    if (student.status === "inactive") {
      return res.json({
        success: true,
        canBorrow: false,
        message: "Student account is inactive. Please contact the library.",
        reason: "inactive_account",
        studentStatus: student.status
      });
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
        reason: "unreturned_book",
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
      message: "Student can borrow a book",
      studentStatus: student.status
    });

  } catch (error) {
    console.error("checkBorrowEligibility error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// MANUAL TEST OVERDUE
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