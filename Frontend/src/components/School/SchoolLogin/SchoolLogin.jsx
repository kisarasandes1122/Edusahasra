import React, { useState } from 'react';
import { MdEmail, MdLock } from 'react-icons/md';
import './SchoolLogin.css';

const SchoolLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Simulate form submission
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsSubmitting(false);
      // Here you would typically make an API call to authenticate
      alert('Login attempt successful! In a real app, this would connect to your backend.');
    }, 1500);
  };
  
  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h1 className="login-title">Welcome to Edusahasra</h1>
        <p className="login-subtitle">You can only log into the account, If your account approved.</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <MdEmail className="form-icon" />
              Email Address<span className="required-mark">*</span>
            </label>
            <input
              type="text"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <MdLock className="form-icon" />
              Password<span className="required-mark">*</span>
            </label>
            <input
              type="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
          
          <div className="form-options">
            <div className="School-login-remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                className="remember-checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe" className="remember-label">Remember Me</label>
            </div>
            <a href="#forgot" className="forgot-link">Forgot Password?</a>
          </div>
          
          <button 
            type="submit" 
            className="signin-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="signup-link-container">
          <p className="signup-text">
            Don't have an Account? <a href="/school-register" className="signup-link">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolLogin;