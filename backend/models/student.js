// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String }, // optional
  lastName: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  course: { type: String },
  yearLevel: { type: String },
  contactNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
