import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockLine, RiMailLine } from 'react-icons/ri';
import './AdminLogin.css';
import logoImage from '../../../assets/images/EduSahasra.png';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        // Here you would normally make an API call to authenticate
        // For demonstration, we'll simulate a successful login after a delay
        setTimeout(() => {
          setIsLoading(false);
          navigate('/admin');
        }, 1000);
      } catch (error) {
        setIsLoading(false);
        setErrors({ form: 'Authentication failed. Please try again.' });
      }
    }
  };

  return (
    <div className="edusahasra-admin-login-container">
      <div className="edusahasra-admin-login-card">
        <div className="edusahasra-admin-login-header">
          <img src={logoImage} alt="EduSahasra Logo" className="edusahasra-admin-login-logo" />
          <h1 className="edusahasra-admin-login-title">Admin Login</h1>
          <p className="edusahasra-admin-login-subtitle">Enter your credentials to access the admin dashboard</p>
        </div>
        
        {errors.form && (
          <div className="edusahasra-admin-login-alert">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="edusahasra-admin-login-form">
          <div className="edusahasra-admin-login-form-group">
            <label className="edusahasra-admin-login-label">
              Email Address
            </label>
            <div className="edusahasra-admin-login-input-group">
              <div className="edusahasra-admin-login-input-icon">
                <RiMailLine />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`edusahasra-admin-login-input ${errors.email ? 'edusahasra-admin-login-input-error' : ''}`}
                placeholder="admin@edusahasra.org"
              />
            </div>
            {errors.email && <p className="edusahasra-admin-login-error">{errors.email}</p>}
          </div>
          
          <div className="edusahasra-admin-login-form-group">
            <label className="edusahasra-admin-login-label">
              Password
            </label>
            <div className="edusahasra-admin-login-input-group">
              <div className="edusahasra-admin-login-input-icon">
                <RiLockLine />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`edusahasra-admin-login-input ${errors.password ? 'edusahasra-admin-login-input-error' : ''}`}
                placeholder="Enter your password"
              />
            </div>
            {errors.password && <p className="edusahasra-admin-login-error">{errors.password}</p>}
          </div>
          
          <div className="edusahasra-admin-login-options">
            <div className="edusahasra-admin-login-remember">
              <input type="checkbox" id="remember" className="edusahasra-admin-login-checkbox" />
              <label htmlFor="remember" className="edusahasra-admin-login-checkbox-label">Remember me</label>
            </div>
            <a href="#" className="edusahasra-admin-login-forgot-link">Forgot password?</a>
          </div>
          
          <button 
            type="submit" 
            className="edusahasra-admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="edusahasra-admin-login-footer">
          <p className="edusahasra-admin-login-help-text">
            Need help? Contact <a href="mailto:support@edusahasra.org" className="edusahasra-admin-login-help-link">support@edusahasra.org</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;