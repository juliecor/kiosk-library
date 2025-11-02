// components/OTPModal.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./OTPModal.css";
import bclogo from "../assets/bclogo.jpg";

export default function OTPModal({ 
  studentId, 
  studentInfo, 
  bookTitle,
  onVerified, 
  onCancel, 
  onBack 
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(180); // 3 minutes
  const [canResend, setCanResend] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  const inputRefs = useRef([]);

  // Start countdown when component mounts
  useEffect(() => {
    sendOTPToStudent();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      toast.error("OTP expired. Please request a new one.", {
        duration: 3000,
        position: 'top-center',
      });
    }
  }, [countdown]);

  // Send OTP to student
  const sendOTPToStudent = async () => {
    setSending(true);
    const loadingToast = toast.loading('Sending OTP to your phone...', {
      position: 'top-center',
    });

    try {
      const response = await axios.post("http://localhost:5000/api/borrow/send-otp", {
        studentId: studentId
      });

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success(
          `📱 OTP sent successfully!\n\nCheck your phone: ${maskPhoneNumber(studentInfo.contactNumber)}`,
          {
            duration: 4000,
            position: 'top-center',
            style: {
              borderRadius: '12px',
              background: '#10b981',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              padding: '16px 24px',
            },
          }
        );
        
        // Reset countdown and attempts
        setCountdown(180);
        setCanResend(false);
        setAttemptsLeft(3);
        setOtp(["", "", "", "", "", ""]);
        
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error sending OTP:", error);
      
      const errorMessage = error.response?.data?.message || "Failed to send OTP";
      
      toast.error(
        `❌ ${errorMessage}\n\nPlease try again or contact the library.`,
        {
          duration: 5000,
          position: 'top-center',
          style: {
            borderRadius: '12px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            padding: '16px 24px',
          },
        }
      );
    } finally {
      setSending(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error("Please paste a valid 6-digit OTP", {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    const otpArray = pastedData.split("");
    setOtp(otpArray);
    
    // Focus last input
    inputRefs.current[5]?.focus();
    
    // Auto-verify
    handleVerifyOTP(pastedData);
  };

  // Verify OTP
  const handleVerifyOTP = async (otpCode = null) => {
    const otpToVerify = otpCode || otp.join("");
    
    if (otpToVerify.length !== 6) {
      toast.error("Please enter all 6 digits", {
        duration: 2000,
        position: 'top-center',
      });
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Verifying OTP...', {
      position: 'top-center',
    });

    try {
      const response = await axios.post("http://localhost:5000/api/borrow/verify-otp", {
        studentId: studentId,
        otp: otpToVerify
      });

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success(
          `✅ OTP Verified!\n\nProceeding to confirmation...`,
          {
            duration: 2000,
            position: 'top-center',
            style: {
              borderRadius: '12px',
              background: '#10b981',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '20px 28px',
            },
          }
        );

        // Wait a moment before proceeding
        setTimeout(() => {
          onVerified();
        }, 500);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error verifying OTP:", error);
      
      const errorMessage = error.response?.data?.message || "Invalid OTP";
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      
      // Clear OTP inputs
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      if (newAttemptsLeft <= 0) {
        toast.error(
          `🚫 Too many failed attempts!\n\nPlease request a new OTP.`,
          {
            duration: 4000,
            position: 'top-center',
            style: {
              borderRadius: '12px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              padding: '20px 28px',
            },
          }
        );
        
        // Reset for new attempt
        setAttemptsLeft(3);
        setCanResend(true);
        setCountdown(0);
      } else {
        toast.error(
          `❌ ${errorMessage}\n\nAttempts remaining: ${newAttemptsLeft}`,
          {
            duration: 4000,
            position: 'top-center',
            style: {
              borderRadius: '12px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              padding: '16px 24px',
            },
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Mask phone number for security
  const maskPhoneNumber = (phone) => {
    if (!phone) return "****";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      return `****-***-${cleaned.slice(-4)}`;
    }
    return phone;
  };

  // Format countdown as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="otp-modal-overlay" onClick={onCancel}>
      <div className="otp-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onCancel}>×</button>

        <div className="otp-header">
          <img src={bclogo} alt="School Logo" className="otp-logo" />
          <h2>Verify Your Identity</h2>
          <p className="otp-subtitle">Enter the OTP sent to your phone</p>
        </div>

        <div className="otp-info-box">
          <div className="otp-info-row">
            <span className="otp-info-icon">👤</span>
            <div>
              <p className="otp-info-label">Student</p>
              <p className="otp-info-value">{studentInfo.firstName} {studentInfo.lastName}</p>
            </div>
          </div>
          <div className="otp-info-row">
            <span className="otp-info-icon">📱</span>
            <div>
              <p className="otp-info-label">Phone</p>
              <p className="otp-info-value">{maskPhoneNumber(studentInfo.contactNumber)}</p>
            </div>
          </div>
          <div className="otp-info-row">
            <span className="otp-info-icon">📖</span>
            <div>
              <p className="otp-info-label">Book</p>
              <p className="otp-info-value">{bookTitle}</p>
            </div>
          </div>
        </div>

        <div className="otp-input-container">
          <label className="otp-label">Enter 6-Digit OTP</label>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={loading || sending || countdown <= 0}
                autoFocus={index === 0}
              />
            ))}
          </div>
          
          {attemptsLeft < 3 && (
            <p className="otp-attempts-warning">
              ⚠️ {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining
            </p>
          )}
        </div>

        <div className="otp-timer">
          {countdown > 0 ? (
            <>
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">
                Code expires in <strong>{formatCountdown()}</strong>
              </span>
            </>
          ) : (
            <span className="timer-expired">⚠️ OTP has expired</span>
          )}
        </div>

        <div className="otp-actions">
          <button
            onClick={handleVerifyOTP}
            className="otp-verify-btn"
            disabled={loading || otp.join("").length !== 6 || countdown <= 0}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            onClick={sendOTPToStudent}
            className="otp-resend-btn"
            disabled={!canResend && countdown > 0}
          >
            {sending ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${formatCountdown()}`}
          </button>
        </div>

        <div className="otp-footer">
          <button onClick={onBack} className="otp-back-btn">
            ← Back to Student ID
          </button>
        </div>

        <div className="otp-help-text">
          <p>💡 Tip: You can paste the OTP from your SMS</p>
          <p>Didn't receive the code? Check your phone or click Resend</p>
        </div>
      </div>
    </div>
  );
}