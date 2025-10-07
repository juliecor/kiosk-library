// models/Book.js
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    ISBN: { type: String, unique: true, sparse: true }, // unique but can be null
    category: { type: String, trim: true },
    volume: { type: String, trim: true },
    publisher: { type: String, trim: true },
    publicationYear: { type: Number },
    shelfLocation: { type: String, trim: true },
     description: { type: String, trim: true },

    editions: [{ type: String, trim: true }], // array for multiple editions
    coverImage: { type: String }, // URL or file path

    totalCopies: { type: Number, default: 1 },
    availableCopies: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["available", "borrowed", "reserved"],
      default: "available",
    },

    isDeleted: { type: Boolean, default: false }, // soft delete
  },
  { timestamps: true }
);

module.exports = mongoose.models.Book || mongoose.model("Book", bookSchema);

