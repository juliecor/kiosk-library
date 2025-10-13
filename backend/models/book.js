// models/Book.js
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    ISBN: { type: String, unique: true, sparse: true },
    category: { type: String, trim: true },
    volume: { type: String, trim: true },
    publisher: { type: String, trim: true },
    publicationYear: { type: Number },
    shelfLocation: { type: String, trim: true },
    description: { type: String, trim: true },

    editions: [{ type: String, trim: true }],
    coverImage: { type: String },

    totalCopies: { 
      type: Number, 
      default: 1,
      min: [0, 'Total copies cannot be negative']
    },
    availableCopies: { 
      type: Number, 
      default: 1,
      min: [0, 'Available copies cannot be negative'],
      validate: {
        validator: function(value) {
          return value <= this.totalCopies;
        },
        message: 'Available copies cannot exceed total copies'
      }
    },

    status: {
      type: String,
      enum: ["available", "borrowed", "reserved"],
      default: "available",
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save hook for extra validation
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    next(new Error('Available copies cannot exceed total copies'));
  } else {
    next();
  }
});

// Pre-update hook for findByIdAndUpdate
bookSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const updateData = update.$set || update;
  
  if (updateData.availableCopies !== undefined || updateData.totalCopies !== undefined) {
    this.model.findOne(this.getQuery()).then(doc => {
      if (doc) {
        const newAvailable = updateData.availableCopies !== undefined 
          ? updateData.availableCopies 
          : doc.availableCopies;
        const newTotal = updateData.totalCopies !== undefined 
          ? updateData.totalCopies 
          : doc.totalCopies;
        
        if (newAvailable > newTotal) {
          next(new Error('Available copies cannot exceed total copies'));
        } else {
          next();
        }
      } else {
        next();
      }
    }).catch(err => next(err));
  } else {
    next();
  }
});

module.exports = mongoose.models.Book || mongoose.model("Book", bookSchema);