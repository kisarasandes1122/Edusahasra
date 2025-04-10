import React, { useState } from 'react';
import { MdEmail, MdLock, MdLanguage } from 'react-icons/md';
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
  const [language, setLanguage] = useState('english'); // 'english' or 'sinhala'
  
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
  
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = language === 'english' ? 'Email address is required' : 'විද්‍යුත් තැපෑල ලිපිනය අවශ්‍යයි';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = language === 'english' ? 'Please enter a valid email address' : 'වලංගු විද්‍යුත් තැපෑල ලිපිනයක් ඇතුළත් කරන්න';
    }
    
    if (!formData.password) {
      newErrors.password = language === 'english' ? 'Password is required' : 'මුරපදය අවශ්‍යයි';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'english' ? 'Password must be at least 6 characters' : 'මුරපදය අවම වශයෙන් අක්ෂර 6ක් විය යුතුය';
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
      alert(language === 'english' ? 
        'Login attempt successful! In a real app, this would connect to your backend.' : 
        'පිවිසීමේ උත්සාහය සාර්ථකයි! සැබෑ යෙදුමක, මෙය ඔබගේ පසුබිම් සේවාවට සම්බන්ධ වනු ඇත.');
    }, 1500);
  };
  
  const translations = {
    title: language === 'english' ? 'Welcome to Edusahasra' : 'Edusahasra වෙත සාදරයෙන් පිළිගනිමු',
    subtitle: language === 'english' 
      ? 'You can only log into the account, If your account approved.' 
      : 'ඔබගේ ගිණුම අනුමත කර ඇත්නම් පමණක් ඔබට ගිණුමට පිවිසිය හැක',
    emailLabel: language === 'english' ? 'Email Address' : 'විද්‍යුත් තැපෑල ලිපිනය',
    passwordLabel: language === 'english' ? 'Password' : 'මුරපදය',
    rememberMe: language === 'english' ? 'Remember Me' : 'මතක තබා ගන්න',
    forgotPassword: language === 'english' ? 'Forgot Password?' : 'මුරපදය අමතක වුණාද?',
    signIn: language === 'english' ? 'Sign in' : 'පිවිසෙන්න',
    noAccount: language === 'english' ? 'Don\'t have an Account?' : 'ගිණුමක් නොමැතිද?',
    signUp: language === 'english' ? 'Sign up' : 'ලියාපදිංචි වන්න',
    emailPlaceholder: language === 'english' ? 'Enter your email address' : 'ඔබගේ විද්‍යුත් තැපෑල ලිපිනය ඇතුළත් කරන්න',
    passwordPlaceholder: language === 'english' ? 'Enter your password' : 'ඔබගේ මුරපදය ඇතුළත් කරන්න',
    selectLanguage: language === 'english' ? 'Select Language' : 'භාෂාව තෝරන්න'
  };
  
  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="language-selector-container">
          <div className="language-selector">
            <MdLanguage className="language-icon" />
            <select value={language} onChange={handleLanguageChange} className="language-select">
              <option value="english">English</option>
              <option value="sinhala">සිංහල</option>
            </select>
          </div>
        </div>
        
        <h1 className="login-title">{translations.title}</h1>
        <p className="login-subtitle">{translations.subtitle}</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <MdEmail className="form-icon" />
              {translations.emailLabel}
              <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder={translations.emailPlaceholder}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <MdLock className="form-icon" />
              {translations.passwordLabel}
              <span className="required-mark">*</span>
            </label>
            <input
              type="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder={translations.passwordPlaceholder}
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
              <label htmlFor="rememberMe" className="remember-label">{translations.rememberMe}</label>
            </div>
            <a href="#forgot" className="forgot-link">{translations.forgotPassword}</a>
          </div>
          
          <button 
            type="submit" 
            className="signin-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 
              (language === 'english' ? 'Signing in...' : 'පිවිසෙමින්...') : 
              translations.signIn}
          </button>
        </form>
        
        <div className="signup-link-container">
          <p className="signup-text">
            {translations.noAccount} <a href="/school-register" className="signup-link">{translations.signUp}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolLogin;