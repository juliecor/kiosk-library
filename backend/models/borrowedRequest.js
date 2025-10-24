// ============================================
// 1. UPDATED MODEL: models/borrowedRequest.js
// ============================================
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
      enum: ["pending", "approved", "denied", "returned","overdue"],
      default: "pending",
    },
    borrowDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
    
    // ✅ EXISTING FIELDS (kept as-is)
    lateFee: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    isLate: { type: Boolean, default: false },
    
    // ✅ BOOK CONDITION
    bookCondition: {
      type: String,
      enum: ["good", "damaged", "lost"],
      default: "good",
    },
    
    // 🆕 NEW FIELDS FOR DAMAGE TRACKING
    damageLevel: {
      type: String,
      enum: ["minor", "moderate", "severe"],
      default: null, // Only set if damaged
    },
    damageDescription: {
      type: String,
      default: null, // Only set if damaged
    },
    damageFee: {
      type: Number,
      default: 0, // Fee for damage or lost book
    },
    
    // 🆕 TOTAL FEE (virtual or calculated)
    totalFee: {
      type: Number,
      default: 0, // lateFee + damageFee
    },
    
    // 🆕 RETURN METADATA
    returnedAt: { type: Date }, // When book was actually returned
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Which admin assessed the return
      default: null,
    },
  },
  { timestamps: true }
);

// 🆕 VIRTUAL FIELD: Calculate total fee on-the-fly
BorrowedRequestSchema.virtual('calculatedTotalFee').get(function() {
  return (this.lateFee || 0) + (this.damageFee || 0);
});

// 🆕 PRE-SAVE HOOK: Auto-calculate totalFee before saving
BorrowedRequestSchema.pre('save', function(next) {
  this.totalFee = (this.lateFee || 0) + (this.damageFee || 0);
  next();
});

module.exports =
  mongoose.models.BorrowedRequest ||
  mongoose.model("BorrowedRequest", BorrowedRequestSchema);