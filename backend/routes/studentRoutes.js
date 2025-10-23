// backend/routes/studentRoutes.js
const express = require("express");
const Student = require("../models/student");
const BorrowedRequest = require("../models/borrowedRequest");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Register new student (Admin only) - YOUR EXISTING CODE
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { firstName, middleName, lastName, course, yearLevel, studentId, educationLevel, contactNumber, email } = req.body;

    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: "Student ID already exists" });
    }

    const student = new Student({
      firstName,
      middleName,
      lastName,
      course,
      yearLevel,
      educationLevel,
      studentId,
      contactNumber,
      email,
      // status will default to "active" automatically
    });

    await student.save();
    res.status(201).json({ success: true, message: "Student registered successfully", student });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all students (Admin only) - YOUR EXISTING CODE
router.get("/", authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🆕 NEW ROUTE - Update student status (Admin only)
router.put("/:studentId/status", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be 'active' or 'inactive'" 
      });
    }

    const student = await Student.findOneAndUpdate(
      { studentId },
      { status },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    res.json({ 
      success: true, 
      message: `Student status updated to ${status}`,
      student 
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get student borrowing history - YOUR EXISTING CODE
router.get("/:studentId/history", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const borrowHistory = await BorrowedRequest.find({ student: student._id })
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    const totalBorrowed = borrowHistory.length;
    const currentBorrows = borrowHistory.filter(b => b.status === "approved").length;
    const totalReturned = borrowHistory.filter(b => b.status === "returned").length;
    const totalLateFees = borrowHistory.reduce((sum, b) => sum + (b.lateFee || 0), 0);
    const unpaidFees = borrowHistory
      .filter(b => b.status === "returned" && b.lateFee > 0 && !b.paid)
      .reduce((sum, b) => sum + b.lateFee, 0);

    res.json({
      success: true,
      student: {
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        studentId: student.studentId,
        course: student.course,
        yearLevel: student.yearLevel,
        email: student.email,
        contactNumber: student.contactNumber,
        status: student.status // 🆕 Include status in response
      },
      history: borrowHistory,
      statistics: {
        totalBorrowed,
        currentBorrows,
        totalReturned,
        totalLateFees,
        unpaidFees
      }
    });
  } catch (error) {
    console.error("Get student history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get student by studentId (Public - for kiosk scanning) - YOUR EXISTING CODE
router.get("/:studentId", async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;