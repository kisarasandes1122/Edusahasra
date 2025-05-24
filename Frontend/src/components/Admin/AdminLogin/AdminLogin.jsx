// frontend/src/components/Admin/AdminLogin/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockLine, RiMailLine } from 'react-icons/ri';
import './AdminLogin.css';
import logoImage from '../../../assets/images/EduSahasra.png';
import api from '../../../api';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    submit: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const adminInfo = localStorage.getItem('adminInfo');
    if (adminInfo) {
      try {
        const parsedAdminInfo = JSON.parse(adminInfo);
        if (parsedAdminInfo && parsedAdminInfo.token) {
          navigate('/admin');
        } else {
          localStorage.removeItem('adminInfo');
        }
      } catch (e) {
        console.error("Error parsing adminInfo from localStorage:", e);
        localStorage.removeItem('adminInfo');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    }
     if (errors.submit) {
         setErrors((prevErrors) => ({
            ...prevErrors,
            submit: '',
        }));
     }
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

    setErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors((prevErrors) => ({ ...prevErrors, submit: '' }));

    if (validateForm()) {
      setIsLoading(true);

      try {
        const response = await api.post('/api/admin/login', {
          email: formData.email,
          password: formData.password
        });

        console.log('Admin Login Response:', response.data);

        if (response.data && response.data.token) {
          localStorage.setItem('adminInfo', JSON.stringify(response.data));

          navigate('/admin');
        } else {
            console.error('Login successful but no token received:', response.data);
            setErrors((prevErrors) => ({
                 ...prevErrors,
                 submit: 'Login successful but received unexpected response. Please try again.'
            }));
        }

      } catch (error) {
        console.error('Admin Login Error:', error);
        let errorMessage = 'An unexpected error occurred. Please try again.';

        if (error.response) {
           console.error('Backend Error Data:', error.response.data);
            errorMessage = error.response.data?.message || `Login failed (Status: ${error.response.status})`;

             if (error.response.status === 401) {
                 errorMessage = error.response.data?.message || 'Invalid email or password.';
             }
        } else if (error.request) {
            errorMessage = 'Network error. Unable to connect to server.';
        } else {
             errorMessage = error.message;
        }

        setErrors((prevErrors) => ({ ...prevErrors, submit: errorMessage }));

      } finally {
        setIsLoading(false);
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

        {errors.submit && (
          <div className="edusahasra-admin-login-alert">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edusahasra-admin-login-form">
          <div className="edusahasra-admin-login-form-group">
            <label className="edusahasra-admin-login-label" htmlFor="admin-email">
              Email Address
            </label>
            <div className="edusahasra-admin-login-input-group">
              <div className="edusahasra-admin-login-input-icon">
                <RiMailLine />
              </div>
              <input
                type="email"
                id="admin-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`edusahasra-admin-login-input ${errors.email ? 'edusahasra-admin-login-input-error' : ''}`}
                placeholder="admin@edusahasra.org"
                required
                aria-required="true"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <p className="edusahasra-admin-login-error">{errors.email}</p>}
          </div>

          <div className="edusahasra-admin-login-form-group">
            <label className="edusahasra-admin-login-label" htmlFor="admin-password">
              Password
            </label>
            <div className="edusahasra-admin-login-input-group">
              <div className="edusahasra-admin-login-input-icon">
                <RiLockLine />
              </div>
              <input
                type="password"
                id="admin-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`edusahasra-admin-login-input ${errors.password ? 'edusahasra-admin-login-input-error' : ''}`}
                placeholder="Enter your password"
                required
                aria-required="true"
                aria-invalid={!!errors.password}
              />
            </div>
            {errors.password && <p className="edusahasra-admin-login-error">{errors.password}</p>}
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