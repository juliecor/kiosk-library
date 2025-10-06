import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";
import bclogo from "../assets/bclogo.jpg"; // ✅ Logo import

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/admin/login", { username, password });

      if (res.data.success) {
        // Save token and redirect
        localStorage.setItem("adminToken", res.data.token);
        window.location.href = "/admin/dashboard"; // ✅ Will now work
      } else {
        setError(res.data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* School Logo */}
        <div className="school-logo">
          <img 
            src={bclogo} 
            alt="Benedicto College Logo" 
            className="logo-image"
          />
        </div>
        
        <div className="login-card">
          <div className="login-header">
            <h2>Admin Login</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="login-icon">🔐</span>
                  Sign In
                </>
              )}
            </button>
          </form>
          
          <div className="login-footer">
            <p className="help-text">
              Need help? Contact the IT administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
