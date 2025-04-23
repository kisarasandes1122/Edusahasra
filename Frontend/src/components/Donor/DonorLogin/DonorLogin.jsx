import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import api from '../../../api'; // Import your configured api instance
import './DonorLogin.css';

const DonorLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false // Keep this if you plan future implementation
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    api: '' // Add state for general API errors
  });

  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state
  const navigate = useNavigate(); // Hook for navigation

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear API error when user types
    if (errors.api) {
        setErrors(prev => ({ ...prev, api: '' }));
    }
  };

  const handleSubmit = async (e) => { // Make the function async
    e.preventDefault();
    
    // Frontend validation
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    // ---- API Call ----
    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, api: '' })); // Clear previous API errors

    try {
      const response = await api.post('/api/donors/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data && response.data.token) {
        // Success! Store user info and token
        localStorage.setItem('donorInfo', JSON.stringify(response.data));
        navigate('/'); // Redirect to home page after login
        window.location.reload();
      } else {
         // Handle unexpected success response format
         setErrors(prev => ({ ...prev, api: 'Login failed. Unexpected response from server.' }));
      }

    } catch (error) {
      // Handle API errors
      const message = error.response?.data?.message || 'Login failed. Please check your credentials or try again later.';
      setErrors(prev => ({ ...prev, api: message }));
      console.error("Login error:", error.response || error);
    } finally {
      setIsSubmitting(false); // Stop loading indicator
    }
    // ---- End API Call ----
  };

  // Keep form validation for button disabling
  const isFormValid = formData.email && formData.password && validateEmail(formData.email);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to make donations and continue your impact
        </p>

        {/* Display API Error Message */}
        {errors.api && (
          <p className="error-message api-error">{errors.api}</p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <div className="input-container">
              <MdEmail className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className={errors.email ? 'input-error' : ''}
                disabled={isSubmitting} // Disable during submission
              />
            </div>
            {errors.email && (
              <p className="error-message">{errors.email}</p>
            )}
          </div>

          <div className="form-group">
            <div className="input-container">
              <RiLockPasswordLine className="input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={errors.password ? 'input-error' : ''}
                disabled={isSubmitting} // Disable during submission
              />
            </div>
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting} // Disable during submission
              />
              <span>Remember Me</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting} // Disable if form invalid or submitting
            className={`login-button ${(!isFormValid || isSubmitting) ? 'button-disabled' : ''}`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'} {/* Show loading text */}
          </button>

          <p className="signup-link">
            Don't have an Account? <a href="/donor-register">Sign up</a> {/* Corrected link */}
          </p>
        </form>
      </div>
    </div>
  );
};

export default DonorLogin;
