// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  educationLevel: { type: String, required: true },
  course: { type: String, required: true },
  yearLevel: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  contactNumber: { type: String },
  email: { type: String },
  
  // 🆕 NEW FIELD - Safe to add, won't break existing data
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active" // Existing students will be "active" by default
  },
  
}, { timestamps: true });

studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.middleName ? this.middleName + " " : ""}${this.lastName}`;
});

module.exports = mongoose.model("Student", studentSchema);