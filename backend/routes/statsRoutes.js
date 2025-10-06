// backend/routes/statsRoutes.js
const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const authMiddleware = require("../middleware/auth");

router.get("/dashboard", authMiddleware, statsController.getDashboardStats);
router.get("/recent-activity", authMiddleware, statsController.getRecentActivity);
router.get("/popular-books", authMiddleware, statsController.getPopularBooks);

module.exports = router;