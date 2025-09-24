// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Connect to DB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("📚 Kiosk Library API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server is running at http://localhost:${PORT}`);
});
