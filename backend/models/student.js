// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String }, // optional, not all students use one
  lastName: { type: String, required: true },
  educationLevel: { type: String, required: true },
  course: { type: String, required: true },
  yearLevel: { type: String, required: true },
  studentId: { type: String, required: true, unique: true }, // Scanned/typed ID
  contactNumber: { type: String }, // for SMS notifications
  email: { type: String },         // optional
}, { timestamps: true });

// For convenience, we can create a virtual field fullName
studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.middleName ? this.middleName + " " : ""}${this.lastName}`;
});

module.exports = mongoose.model("Student", studentSchema);
