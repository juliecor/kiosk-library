import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard"; // ✅ Import Dashboard
import StudentBooks from "./pages/StudentBooks";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />   
        <Route path="/books"  element ={<StudentBooks/>} />
        <Route path="/login" element={<LoginPage />} />   
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> {/* ✅ Added */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
