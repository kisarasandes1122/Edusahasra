// frontend/src/components/Admin/AdminLogin/AdminLogin.jsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router-dom';
import { RiLockLine, RiMailLine } from 'react-icons/ri';
import './AdminLogin.css';
import logoImage from '../../../assets/images/EduSahasra.png';
import api from '../../../api'; // Import your API instance

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    submit: '' // Use 'submit' for general form errors
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in on component mount
  useEffect(() => {
    const adminInfo = localStorage.getItem('adminInfo');
    if (adminInfo) {
      try {
        const parsedAdminInfo = JSON.parse(adminInfo);
        if (parsedAdminInfo && parsedAdminInfo.token) {
          // If admin info exists and has a token, redirect to admin dashboard
          navigate('/admin');
        } else {
          // If data exists but is invalid, clear it
          localStorage.removeItem('adminInfo');
        }
      } catch (e) {
        console.error("Error parsing adminInfo from localStorage:", e);
        localStorage.removeItem('adminInfo'); // Clear corrupted data
      }
    }
  }, [navigate]); // Add navigate as a dependency

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear field-specific error when typing
    if (errors[name]) {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    }
     // Clear general submission error on any change
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

    setErrors((prevErrors) => ({ ...prevErrors, ...newErrors })); // Update specific errors
    return Object.keys(newErrors).length === 0; // Check specific errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous submission error
    setErrors((prevErrors) => ({ ...prevErrors, submit: '' }));

    if (validateForm()) {
      setIsLoading(true);

      try {
        // Make the actual API call to your backend login endpoint
        const response = await api.post('/api/admin/login', {
          email: formData.email,
          password: formData.password
        });

        console.log('Admin Login Response:', response.data); // Debug log

        if (response.data && response.data.token) {
          // Store admin info (including token) in localStorage
          localStorage.setItem('adminInfo', JSON.stringify(response.data));

          // Redirect to the admin dashboard
          navigate('/admin');
        } else {
           // This case should ideally not be reached if backend is structured to always return token on success
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
            // Use backend error message if available
            errorMessage = error.response.data?.message || `Login failed (Status: ${error.response.status})`;

             // Handle specific backend messages if needed (e.g., invalid credentials)
             if (error.response.status === 401) { // Unauthorized
                 errorMessage = error.response.data?.message || 'Invalid email or password.'; // Use backend message or default
             }
        } else if (error.request) {
            // The request was made but no response was received
            errorMessage = 'Network error. Unable to connect to server.';
        } else {
             // Something else happened in setting up the request
             errorMessage = error.message;
        }

        setErrors((prevErrors) => ({ ...prevErrors, submit: errorMessage }));

      } finally {
        setIsLoading(false); // Stop loading regardless of success or failure
      }
    }
  };

  return (
    <div className="edusahasra-admin-login-container">
      <div className="edusahasra-admin-login-card">
        <div className="edusahasra-admin-login-header">
          {/* Assuming logoImage is correctly imported */}
          <img src={logoImage} alt="EduSahasra Logo" className="edusahasra-admin-login-logo" />
          <h1 className="edusahasra-admin-login-title">Admin Login</h1>
          <p className="edusahasra-admin-login-subtitle">Enter your credentials to access the admin dashboard</p>
        </div>

        {/* Display general submission error */}
        {errors.submit && (
          <div className="edusahasra-admin-login-alert">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edusahasra-admin-login-form">
          <div className="edusahasra-admin-login-form-group">
            <label className="edusahasra-admin-login-label" htmlFor="admin-email"> {/* Added htmlFor */}
              Email Address
            </label>
            <div className="edusahasra-admin-login-input-group">
              <div className="edusahasra-admin-login-input-icon">
                <RiMailLine />
              </div>
              <input
                type="email"
                id="admin-email" // Added id
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`edusahasra-admin-login-input ${errors.email ? 'edusahasra-admin-login-input-error' : ''}`}
                placeholder="admin@edusahasra.org"
                required // Added required attribute
                aria-required="true" // Accessibility
                aria-invalid={!!errors.email} // Accessibility
              />
            </div>
            {errors.email && <p className="edusahasra-admin-login-error">{errors.email}</p>}
          </div>

          <div className="edusahasra-admin-login-form-group">
            <label className="edusahasra-admin-login-label" htmlFor="admin-password"> {/* Added htmlFor */}
              Password
            </label>
            <div className="edusahasra-admin-login-input-group">
              <div className="edusahasra-admin-login-input-icon">
                <RiLockLine />
              </div>
              <input
                type="password"
                id="admin-password" // Added id
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`edusahasra-admin-login-input ${errors.password ? 'edusahasra-admin-login-input-error' : ''}`}
                placeholder="Enter your password"
                required // Added required attribute
                 aria-required="true" // Accessibility
                 aria-invalid={!!errors.password} // Accessibility
              />
            </div>
            {errors.password && <p className="edusahasra-admin-login-error">{errors.password}</p>}
          </div>

          {/* Removed Remember Me and Forgot Password for standard admin login */}
          {/* <div className="edusahasra-admin-login-options">
            <div className="edusahasra-admin-login-remember">
              <input type="checkbox" id="remember" className="edusahasra-admin-login-checkbox" />
              <label htmlFor="remember" className="edusahasra-admin-login-checkbox-label">Remember me</label>
            </div>
            <a href="#" className="edusahasra-admin-login-forgot-link">Forgot password?</a>
          </div> */}

          <button
            type="submit"
            className="edusahasra-admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
             {/* Optional: Add a small spinner icon if you have one */}
             {/* {isLoading && <YourSpinnerComponent size={20} />} */}
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