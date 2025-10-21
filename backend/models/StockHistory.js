const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["add", "remove"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      enum: ["correction", "repair", "new-purchase", "damaged", "lost", "other"],
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    previousAvailable: {
      type: Number,
      required: true,
    },
    previousTotal: {
      type: Number,
      required: true,
    },
    newAvailable: {
      type: Number,
      required: true,
    },
    newTotal: {
      type: Number,
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockHistory", stockHistorySchema);