const express = require("express");
const router = express.Router();
const borrowController = require("../controllers/borrowController");

// @route   POST /api/borrow/request
router.post("/request", borrowController.createBorrowRequest);

// @route   GET /api/borrow/requests
router.get("/requests", borrowController.getAllRequests);

// @route   PUT /api/borrow/approve/:id
router.put("/approve/:id", borrowController.approveRequest);

// @route   PUT /api/borrow/deny/:id
router.put("/deny/:id", borrowController.denyRequest);

// @route   PUT /api/borrow/return/:id
router.put("/return/:id", borrowController.returnBook);

// @route   PUT /api/borrow/pay-fee/:id
router.put("/pay-fee/:id", borrowController.payLateFee);




module.exports = router;