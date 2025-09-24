// models/BorrowRequest.js
const mongoose = require("mongoose");

const borrowRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "denied", "returned"],
    default: "pending"
  },
  requestDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  returnDate: { type: Date },

  lateFee: { type: Number, default: 0 },
  feePaid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("BorrowRequest", borrowRequestSchema);
