import React, { useState } from 'react';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import './DonorLogin.css';

const DonorLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

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


    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    

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
      setErrors(newErrors);
      return;
    }

    console.log('Form submitted:', formData);
  };

  const isFormValid = formData.email && formData.password && validateEmail(formData.email);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to make donations and continue your impact
        </p>

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
              />
              <span>Remember Me</span>
            </label>
            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`login-button ${!isFormValid ? 'button-disabled' : ''}`}
          >
            Sign in
          </button>

          <p className="signup-link">
            Don't have an Account? <a href="#">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default DonorLogin;