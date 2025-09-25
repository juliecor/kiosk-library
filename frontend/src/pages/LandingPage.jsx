// LandingPage.js
import React from "react";
import "./LandingPage.css";
import bclogo from "../assets/bclogo.jpg"; // Import your logo

const LandingPage = () => {
  const handleBrowseBooks = () => {
    // Navigate to books catalog - you can replace this with your routing logic
    console.log("Navigate to books catalog");
  };

  return (
    <div className="landing-page">
      {/* Background decorative elements */}
      <div className="bg-decoration bg-decoration-1"></div>
      <div className="bg-decoration bg-decoration-2"></div>
      
      <div className="container">
        {/* Main Content Container */}
        <div className="main-content">
          
          {/* Left Side - Welcome Content */}
          <div className="left-section">
            {/* Main Content Card - Now Transparent */}
            <div className="content-card transparent-card">
              {/* Logo positioned in upper left of card as overlapping circle */}
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
                  </p>
                </div>
                
                {/* Browse Books Button */}
                <div className="button-section">
                  <button onClick={handleBrowseBooks} className="browse-button">
                    <span className="button-icon">📖</span>
                    <span>Browse Books</span>
                    <div className="button-indicator"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Rules & Regulations */}
          <div className="right-section">
            <div className="rules-card">
              {/* Decorative background pattern */}
              <div className="rules-decoration rules-decoration-1"></div>
              <div className="rules-decoration rules-decoration-2"></div>
              
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
        
        {/* Bottom Welcome Message */}
        <div className="bottom-message">
          <p className="welcome-message">
            Welcome to your gateway to knowledge and learning
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;