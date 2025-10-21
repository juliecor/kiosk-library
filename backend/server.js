// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const bookRoutes = require("./routes/bookRoutes");
const studentRoutes = require("./routes/studentRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const statsRoutes = require("./routes/statsRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const inventoryRoutes = require('./routes/inventory');

const cors = require("cors");

dotenv.config();

const app = express();

// Body parser
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use('/uploads', express.static('uploads'));


// Connect to DB
connectDB();

app.use('/api/inventory', inventoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reports", reportsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server is running at http://localhost:${PORT}`);
});
