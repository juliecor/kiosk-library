
// src/pages/LandingPage.jsx
import React from "react";
import "./LandingPage.css";
import bclogo from "../assets/bclogo.jpg"; 
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleBrowseBooks = () => {
    navigate("/books"); // ✅ go to StudentBooks.jsx page
  };
  return (
    
    <div className="landing-page">
      
      <div className="container">
        <div className="main-content">
          <div className="left-section">
            <div className="content-card transparent-card">
              <div className="card-logo-container">
                <div className="card-logo-circle">
                  <img 
                    src={bclogo} // Use the imported logo
                    alt="Benedicto College Library Logo" 
                    className="school-logo-image"
                  />
                </div>
              </div>
              
              <div className="card-content">
                <div className="header-section">
                  <h1 className="main-title">
                    Benedicto College
                    <span className="title-accent">Library</span>
                  </h1>
                  <p className="description">
                    Discover a world of knowledge at your fingertips. Our digital kiosk provides 
                    seamless access to thousands of books, journals, and digital resources.
                    seamless access to thousands of books, journals, and digital resources.
                    seamless access to thousands of books, journals. and digital resources.
                    journals. and digital resources.
                  </p>
                </div>
                
                {/* Browse Books Button */}
                <div className="button-section">
                  <button onClick={handleBrowseBooks} className="browse-button">
                    <span className="button-icon">📖</span>
                    <span>Browse Books</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Rules & Regulations */}
          <div className="right-section">
            <div className="rules-card">
              <div className="rules-content">
                <div className="rules-header">
                  <span className="rules-icon">🛡️</span>
                  <h2 className="rules-title">Library Guidelines</h2>
                </div>
                
                <div className="rules-list">
                  <div className="rule-item">
                    <div className="rule-icon">
                      <span>🆔</span>
                    </div>
                    <p className="rule-text">Present your student ID when borrowing books</p>
                  </div>
                  <div className="rule-item">
                    <div className="rule-icon">
                      <span>📖</span>
                    </div>
                    <p className="rule-text">Handle all materials with care and respect</p>
                  </div>
                  <div className="rule-item">
                    <div className="rule-icon">
                      <span>⏰</span>
                    </div>
                    <p className="rule-text">Return books by the specified due date</p>
                  </div>
                  <div className="rule-item">
                    <div className="rule-icon">
                      <span>🤫</span>
                    </div>
                    <p className="rule-text">Maintain a quiet, studious environment</p>
                  </div>
                  <div className="rule-item">
                    <div className="rule-icon">
                      <span>👥</span>
                    </div>
                    <p className="rule-text">Follow all staff instructions and library policies</p>
                  </div>
                </div>
                
                <div className="help-section">
                  <p className="help-text">
                    📚 Need help? Ask our friendly librarians at the front desk!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;