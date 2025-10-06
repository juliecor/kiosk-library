const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Admin = require("./models/admin");

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
    } else {
      const admin = new Admin({
        fullName: "Default Librarian",
        username: "admin",
        password: "admin123", // plain here → auto-hashed by model
      });
      await admin.save();
      console.log("✅ Admin created with hashed password:", admin.username);
    }
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
