// backend/models/student.js - UPDATED WITH PENALTY SYSTEM
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  // ========== EXISTING FIELDS ==========
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  educationLevel: { type: String, required: true },
  course: { type: String, required: true },
  yearLevel: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  contactNumber: { type: String },
  email: { type: String },
  
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  
  // ========== 🆕 NEW PENALTY SYSTEM FIELDS ==========
  
  // Damage Tracking
  damagedBooksCount: {
    type: Number,
    default: 0,
    description: "Count of damaged books (ban after 3)"
  },
  
  lostBooksCount: {
    type: Number,
    default: 0,
    description: "Count of lost books (ban after 1)"
  },
  
  // Ban Status
  banStatus: {
    type: String,
    enum: ["active", "warning", "banned"],
    default: "active",
    description: "Current ban status"
  },
  
  bannedUntil: {
    type: Date,
    default: null,
    description: "Date when ban expires (null if not banned)"
  },
  
  banCount: {
    type: Number,
    default: 0,
    description: "Total number of times banned (for progressive penalties)"
  },
  
  // Ban History (Track all bans)
  banHistory: [{
    reason: {
      type: String,
      required: true,
      description: "e.g., '3 damaged books' or '1 lost book'"
    },
    bannedDate: {
      type: Date,
      required: true,
      description: "When ban started"
    },
    bannedUntil: {
      type: Date,
      required: true,
      description: "When ban ends"
    },
    banNumber: {
      type: Number,
      required: true,
      description: "1st ban, 2nd ban, 3rd ban, etc."
    },
    damageCount: {
      type: Number,
      description: "Damaged books count at time of ban"
    },
    lostCount: {
      type: Number,
      description: "Lost books count at time of ban"
    }
  }],
  
  // Damage History (Track each incident)
  damageHistory: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book"
    },
    bookTitle: String,
    incidentType: {
      type: String,
      enum: ["damaged", "lost"],
      required: true
    },
    incidentDate: {
      type: Date,
      default: Date.now
    },
    feeAmount: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      description: "Details about the damage/loss"
    },
    borrowRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BorrowedRequest"
    }
  }],
  
  // Badge System
  badge: {
    type: String,
    enum: [
      "perfect",       // 🌟 Perfect Record (0 damaged, 0 lost, 10+ books borrowed)
      "responsible",   // ⭐ Responsible (0-2 damaged, 0 lost)
      "regular",       // 📚 Regular (clean, less than 10 books)
      "caution",       // ⚠️ Caution (2 damaged or approaching limit)
      "watch-list",    // 🔶 Watch List (3+ damaged, been banned before)
      "suspended",     // 🚫 Suspended (currently banned)
      "offender"       // ❌ Repeat Offender (banned 2+ times)
    ],
    default: "regular",
    description: "Current badge level based on behavior"
  },
  
  // Reset Tracking
  lastPenaltyReset: {
    type: Date,
    default: null,
    description: "When penalties were last reset by admin"
  },
  
  penaltyNotes: {
    type: String,
    default: "",
    description: "Admin notes about penalties/behavior"
  }
  
}, { timestamps: true });

// ========== VIRTUAL FIELDS ==========

studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.middleName ? this.middleName + " " : ""}${this.lastName}`;
});

// Check if student is currently banned
studentSchema.virtual("isBanned").get(function () {
  if (!this.bannedUntil) return false;
  return new Date() < this.bannedUntil;
});

// Days remaining in ban
studentSchema.virtual("daysUntilBanExpires").get(function () {
  if (!this.bannedUntil || new Date() >= this.bannedUntil) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = this.bannedUntil - new Date();
  return Math.ceil(diff / msPerDay);
});

// Total incidents (damaged + lost)
studentSchema.virtual("totalIncidents").get(function () {
  return this.damagedBooksCount + this.lostBooksCount;
});

// ========== INSTANCE METHODS ==========

// Calculate and update badge based on current status
studentSchema.methods.updateBadge = function() {
  const totalBorrows = this.damageHistory.length; // Approximate
  
  // Currently banned
  if (this.isBanned) {
    this.badge = "suspended";
  }
  // Repeat offender (banned 2+ times)
  else if (this.banCount >= 2) {
    this.badge = "offender";
  }
  // Watch list (3+ damaged or been banned once)
  else if (this.damagedBooksCount >= 3 || this.banCount >= 1) {
    this.badge = "watch-list";
  }
  // Caution (2 damaged books - close to limit)
  else if (this.damagedBooksCount === 2) {
    this.badge = "caution";
  }
  // Perfect record (no issues, 10+ books)
  else if (this.damagedBooksCount === 0 && this.lostBooksCount === 0 && totalBorrows >= 10) {
    this.badge = "perfect";
  }
  // Responsible (0-1 damaged, no lost)
  else if (this.damagedBooksCount <= 1 && this.lostBooksCount === 0) {
    this.badge = "responsible";
  }
  // Regular (default)
  else {
    this.badge = "regular";
  }
  
  return this.badge;
};

// Get badge display info
studentSchema.methods.getBadgeInfo = function() {
  const badges = {
    "perfect": { icon: "🌟", name: "Perfect Record", color: "#10b981" },
    "responsible": { icon: "⭐", name: "Responsible", color: "#3b82f6" },
    "regular": { icon: "📚", name: "Regular", color: "#6b7280" },
    "caution": { icon: "⚠️", name: "Caution", color: "#f59e0b" },
    "watch-list": { icon: "🔶", name: "Watch List", color: "#ea580c" },
    "suspended": { icon: "🚫", name: "Suspended", color: "#dc2626" },
    "offender": { icon: "❌", name: "Repeat Offender", color: "#991b1b" }
  };
  
  return badges[this.badge] || badges.regular;
};

// Check if student should be warned (approaching ban)
studentSchema.methods.shouldShowWarning = function() {
  // Warn if 2 damaged books (one more = ban)
  if (this.damagedBooksCount === 2) {
    return {
      show: true,
      message: "⚠️ WARNING: You have 2 damaged books. One more will result in a 3-day ban.",
      level: "warning"
    };
  }
  
  // Already banned
  if (this.isBanned) {
    return {
      show: true,
      message: `🚫 Your account is BANNED until ${this.bannedUntil.toLocaleDateString()}. You cannot borrow books.`,
      level: "error"
    };
  }
  
  // On watch list (been banned before)
  if (this.banCount > 0 && this.damagedBooksCount >= 1) {
    return {
      show: true,
      message: `⚠️ You're on the watch list (${this.damagedBooksCount} damaged, ${this.banCount} previous ban(s)). Please take care of books.`,
      level: "warning"
    };
  }
  
  return { show: false };
};

// ========== STATIC METHODS ==========

// Get all students who need warnings
studentSchema.statics.getStudentsNeedingWarning = function() {
  return this.find({
    $or: [
      { damagedBooksCount: { $gte: 2 } },
      { banStatus: "warning" }
    ],
    status: "active"
  });
};

// Get all currently banned students
studentSchema.statics.getCurrentlyBanned = function() {
  return this.find({
    bannedUntil: { $gte: new Date() },
    status: "active"
  });
};

// Get all repeat offenders
studentSchema.statics.getRepeatOffenders = function() {
  return this.find({
    banCount: { $gte: 2 },
    status: "active"
  });
};

// ========== PRE-SAVE MIDDLEWARE ==========

// Auto-update badge before saving
studentSchema.pre('save', function(next) {
  if (this.isModified('damagedBooksCount') || 
      this.isModified('lostBooksCount') || 
      this.isModified('bannedUntil') ||
      this.isModified('banCount')) {
    this.updateBadge();
  }
  
  // Auto-update ban status based on bannedUntil date
  if (this.bannedUntil) {
    if (new Date() < this.bannedUntil) {
      this.banStatus = "banned";
    } else {
      this.banStatus = "active";
      // Don't clear bannedUntil - keep for history
    }
  }
  
  next();
});

// ========== INDEXES ==========
studentSchema.index({ studentId: 1 });
studentSchema.index({ banStatus: 1 });
studentSchema.index({ bannedUntil: 1 });
studentSchema.index({ badge: 1 });

module.exports = mongoose.model("Student", studentSchema);