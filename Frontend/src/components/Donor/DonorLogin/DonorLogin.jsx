import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import api from '../../../api';
import './DonorLogin.css';

const DonorLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    api: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    if (errors.api) {
        setErrors(prev => ({ ...prev, api: '' }));
    }
  };

  const handleSubmit = async (e) => {
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
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, api: '' }));

    try {
      const response = await api.post('/api/donors/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data && response.data.token) {
        localStorage.setItem('donorInfo', JSON.stringify(response.data));
        navigate('/');
        window.location.reload();
      } else {
         setErrors(prev => ({ ...prev, api: 'Login failed. Unexpected response from server.' }));
      }

    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials or try again later.';
      setErrors(prev => ({ ...prev, api: message }));
      console.error("Login error:", error.response || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.password && validateEmail(formData.email);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to make donations and continue your impact
        </p>

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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <span>Remember Me</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`login-button ${(!isFormValid || isSubmitting) ? 'button-disabled' : ''}`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="signup-link">
            Don't have an Account? <a href="/donor-register">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default DonorLogin;