// models/BorrowedRequest.js

const mongoose = require("mongoose");

const BorrowedRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "denied", "returned"],
      default: "pending",
    },
    borrowDate: {
      type: Date,
    },
    returnDate: {
      type: Date,
    },
    lateFee: {
      type: Number,
      default: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BorrowedRequest", BorrowedRequestSchema);
