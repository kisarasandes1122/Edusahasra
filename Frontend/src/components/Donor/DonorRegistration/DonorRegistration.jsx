import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaLock, FaPhone, FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import './DonorRegistration.css';

const DonorRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    agreeToTerms: false,
    latitude: '',
    longitude: ''
  });

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    location: ''
  });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const passwordRef = useRef(null);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (passwordRef.current && !passwordRef.current.contains(event.target)) {
        setIsPasswordFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validatePassword = (password) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      validatePassword(value);
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(Boolean);
  };

  const handleGetLocation = () => {
    setIsLocationLoading(true);
    setErrors(prev => ({ ...prev, location: '' }));
    
    if (!navigator.geolocation) {
      setErrors(prev => ({ 
        ...prev, 
        location: 'Geolocation is not supported by your browser' 
      }));
      setIsLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          }
        } catch (error) {
          console.error('Error fetching address:', error);
        }
        
        setIsLocationLoading(false);
      },
      (error) => {
        setIsLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrors(prev => ({ 
              ...prev, 
              location: 'User denied the request for geolocation' 
            }));
            break;
          case error.POSITION_UNAVAILABLE:
            setErrors(prev => ({ 
              ...prev, 
              location: 'Location information is unavailable' 
            }));
            break;
          case error.TIMEOUT:
            setErrors(prev => ({ 
              ...prev, 
              location: 'The request to get user location timed out' 
            }));
            break;
          default:
            setErrors(prev => ({ 
              ...prev, 
              location: 'An unknown error occurred' 
            }));
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isPasswordValid()) {
      setErrors(prev => ({
        ...prev,
        password: 'Password does not meet all requirements'
      }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    console.log('Form submitted:', formData);
  };

  return (
    <div className="donor-registration">
      <h1>Register as a Donor</h1>
      <p className="subtitle">
        Join us in making a difference! Register now to donate educational supplies and
        support students in need
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <FaUser className="icon" />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <MdEmail className="icon" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" ref={passwordRef}>
          <FaLock className="icon" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setIsPasswordFocused(true)}
            required
          />
          {isPasswordFocused && formData.password && (
            <div className="password-requirements">
              <ul>
                <li className={passwordStrength.hasMinLength ? 'valid' : ''}>
                  <span className="check-icon">
                    {passwordStrength.hasMinLength ? '✓' : '•'}
                  </span>
                  At least 8 characters
                </li>
                <li className={passwordStrength.hasUpperCase ? 'valid' : ''}>
                  <span className="check-icon">
                    {passwordStrength.hasUpperCase ? '✓' : '•'}
                  </span>
                  One uppercase letter
                </li>
                <li className={passwordStrength.hasLowerCase ? 'valid' : ''}>
                  <span className="check-icon">
                    {passwordStrength.hasLowerCase ? '✓' : '•'}
                  </span>
                  One lowercase letter
                </li>
                <li className={passwordStrength.hasNumber ? 'valid' : ''}>
                  <span className="check-icon">
                    {passwordStrength.hasNumber ? '✓' : '•'}
                  </span>
                  One number
                </li>
                <li className={passwordStrength.hasSpecialChar ? 'valid' : ''}>
                  <span className="check-icon">
                    {passwordStrength.hasSpecialChar ? '✓' : '•'}
                  </span>
                  One special character
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <FaLock className="icon" />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && (
            <div className="error-message">{errors.confirmPassword}</div>
          )}
        </div>

        <div className="form-group">
          <FaPhone className="icon" />
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group address-group">
          <FaMapMarkerAlt className="icon" />
          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <button 
            type="button" 
            className="location-button"
            onClick={handleGetLocation}
            disabled={isLocationLoading}
          >
            <FaLocationArrow className="location-icon" />
            {isLocationLoading ? 'Getting Location...' : 'Get My Location'}
          </button>
          {errors.location && (
            <div className="error-message">{errors.location}</div>
          )}
          {formData.latitude && formData.longitude && (
            <div className="location-info">
              Location detected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </div>
          )}
        </div>

        <div className="donor-register-form-group checkbox">
          <input
            type="checkbox"
            name="agreeToTerms"
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            required
          />
          <label htmlFor="agreeToTerms">
            I agree to the Terms & Conditions
          </label>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={!isPasswordValid() || formData.password !== formData.confirmPassword}
        >
          Register as a Donor
        </button>
      </form>

      <p className="login-link">
        Already have an Account? <a href="/DonorLogin">Login</a>
      </p>
    </div>
  );
};

export default DonorRegistration;