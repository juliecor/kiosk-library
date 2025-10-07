// backend/routes/reportsRoutes.js
const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const authMiddleware = require("../middleware/auth");

// All reports routes require authentication
router.get("/summary", authMiddleware, reportsController.getReportSummary);
router.get("/most-borrowed", authMiddleware, reportsController.getMostBorrowedBooks);
router.get("/overdue", authMiddleware, reportsController.getOverdueBooks);
router.get("/top-borrowers", authMiddleware, reportsController.getTopBorrowers);
router.get("/trends", authMiddleware, reportsController.getBorrowingTrends);
router.get("/late-fees", authMiddleware, reportsController.getLateFeesSummary);

module.exports = router;