// models/Book.js
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  ISBN: { type: String, unique: true },
  category: { type: String },
  volume: { type: String },
  publisher: { type: String },
  publicationYear: { type: Number },
  shelfLocation: { type: String },
  editions: { type: String },
  coverImage: { type: String }, // file path / URL

  availableCopies: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
