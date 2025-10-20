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

// 🆕 NEW ROUTES FOR PENALTY SYSTEM
router.get("/financial-summary", authMiddleware, reportsController.getFinancialSummary);
router.get("/book-condition", authMiddleware, reportsController.getBookConditionReport);
router.get("/damaged-books", authMiddleware, reportsController.getDamagedBooks);
router.get("/lost-books", authMiddleware, reportsController.getLostBooks);
router.get("/students-with-fees", authMiddleware, reportsController.getStudentsWithFees);
router.get("/damage-analysis", authMiddleware, reportsController.getDamageAnalysis);
router.get("/summary-by-range", authMiddleware, reportsController.getSummaryByRange);
router.get("/returned-books", authMiddleware, reportsController.getReturnedBooksReport);

// 🆕 PAYMENT TRANSACTIONS FOR TRANSPARENCY
router.get("/payment-transactions", authMiddleware, reportsController.getPaymentTransactions);

module.exports = router;