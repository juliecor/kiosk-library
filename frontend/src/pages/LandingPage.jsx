// src/pages/LandingPage.jsx
// TUTORIAL BUTTON VERSION - Kid Friendly!
import React, { useState, useEffect } from "react";
import "./LandingPage.css";
import bclogo from "../assets/bclogo.jpg"; 
import step1 from "../assets/1.png";
import step2 from "../assets/2.png";
import step3  from "../assets/3.png";
import step4  from "../assets/4.png";
import step5  from "../assets/5.png";
import step6  from "../assets/6.png";
import step7  from "../assets/7.png";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false); // Controls tutorial visibility

  // YOUR SCREENSHOTS GO HERE
  const slides = [
    {
      title: "Step 1: Click Browse Books",
      description: "Click the blue 'Browse Books' button to start",
      image: step4,
      stepNumber: "1"
    },
    {
      title: "Step 2: Search for a Book",
      description: "Type the book name you want in the search box",
      image: step5,
      stepNumber: "2"
    },
    {
      title: "Step 3: Click the Borrow Button",
      description: "Find your book and click Borrow button",
      image: step6,
      stepNumber: "3"
    },
    {
      title: "Step 4: Enter Your ID",
      description: "Type your student ID number carefully and then click Next button",
      image: step1,
      stepNumber: "4"
    },
    {
      title: "Step 5: Then click the I agree to proceed",
      description: "Click the i agree checkbox",
     image: step2,
      stepNumber: "5"
    },
    {
      title: "Step 6: Then Click the Confirm Borrow",
      description: "CLick the blue Button 🎉",
      image: step3,
      stepNumber: "6"
    },
     {
      title: "Step 7: Done ",
      description: "Congratulations 🎉",
      image: step7,
      stepNumber: "7"
    }
  ];

  // Auto-rotate carousel slides every 5 seconds (only when tutorial is open)
  useEffect(() => {
    if (showTutorial) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [showTutorial, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleBrowseBooks = () => {
    navigate("/books");
  };

  const openTutorial = () => {
    setShowTutorial(true);
    setCurrentSlide(0); // Start from first slide
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div className="landing-page">
      <div className="container">
        
        {/* MAIN DESIGN - Always Visible */}
        <div className="main-content">
          <div className="left-section">
            <div className="content-card transparent-card">
              <div className="card-logo-container">
                <div className="card-logo-circle">
                  <img 
                    src={bclogo}
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

                {/* BIG TUTORIAL BUTTON */}
                <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <button 
                    onClick={openTutorial}
                    style={{
                      width: '100%',
                      padding: '20px 32px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: '4px solid white',
                      borderRadius: '16px',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.4)';
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>📚</span>
                    <span>First Time? Learn How to Borrow Books!</span>
                  </button>
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

        {/* TUTORIAL MODAL/OVERLAY - Only shows when button clicked */}
        {showTutorial && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <div style={{
              width: '100%',
             maxHeight:'900px',
              maxWidth: '1400px',
              position: 'relative'
            }}>

              {/* Carousel Box */}
              <div 
                style={{
                  background: '#6d6d6eff',
                  borderRadius: '24px',
                  padding: '30px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '6px solid transparent',
                  borderImage: 'linear-gradient(to right, #1203e7 50%, #efb104 50%) 1',
                  position: 'relative'
                }}
              >
                {/* Step Number Circle */}
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #1203e7, #3730a3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  border: '4px solid white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  zIndex: 10
                }}>
                  {slides[currentSlide].stepNumber}
                </div>

                {/* Slide Content */}
                <div style={{ marginTop: '20px' }}>
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      style={{
                        display: index === currentSlide ? 'block' : 'none',
                        textAlign: 'center'
                      }}
                    >
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '12px'
                      }}>
                        {slide.title}
                      </h3>

                      <div style={{
                        marginBottom: '20px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        border: '4px solid #e5e7eb'
                      }}>
                        <img 
                          src={slide.image}
                          alt={slide.title}
                          style={{
                            width: '100%',
                            maxHeight: '500px',
                            objectFit: 'fit',
                            background: '#f3f4f6'
                          }}
                        />
                      </div>

                      <p style={{
                        fontSize: '1.15rem',
                        color: '#374151',
                        lineHeight: '1.5',
                        fontWeight: '500'
                      }}>
                        {slide.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Arrow Buttons */}
                <button
                  onClick={prevSlide}
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1203e7, #3730a3)',
                    border: '4px solid white',
                    color: 'white',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                >
                  ◀
                </button>

                <button
                  onClick={nextSlide}
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1203e7, #3730a3)',
                    border: '4px solid white',
                    color: 'white',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                >
                  ▶
                </button>

                {/* Dots */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '7px',
                  marginTop: '10px',
                  marginBottom: '10px'
                }}>
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      style={{
                        width: index === currentSlide ? '50px' : '20px',
                        height: '20px',
                        borderRadius: '10px',
                        background: index === currentSlide 
                          ? 'linear-gradient(135deg, #1203e7, #efb104)' 
                          : '#cbd5e1',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: index === currentSlide ? '0 4px 12px rgba(18,3,231,0.4)' : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* "Got It!" Button - INSIDE the box now */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
                  <button
                    onClick={closeTutorial}
                    style={{
                      padding: '14px 36px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: '4px solid white',
                      borderRadius: '14px',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.5)',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.7)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.5)';
                    }}
                  >
                    ✓ Got It! Let's Borrow Books!
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;