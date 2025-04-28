import React, { useState, useEffect } from 'react';
import { MdLock, MdLanguage } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api';
import './ResetPassword.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const navigate = useNavigate();
  const { token } = useParams();

  const translations = {
    title: language === 'english' ? 'Reset Password' : 'මුරපදය යළි පිහිටුවන්න',
    subtitle: language === 'english' 
      ? 'Please enter your new password'
      : 'කරුණාකර ඔබගේ නව මුරපදය ඇතුළත් කරන්න',
    passwordLabel: language === 'english' ? 'New Password' : 'නව මුරපදය',
    confirmPasswordLabel: language === 'english' ? 'Confirm New Password' : 'නව මුරපදය තහවුරු කරන්න',
    submitButton: language === 'english' ? 'Reset Password' : 'මුරපදය යළි පිහිටුවන්න',
    backToLogin: language === 'english' ? 'Back to Login' : 'පිවිසීමට ආපසු යන්න',
    selectLanguage: language === 'english' ? 'Select Language' : 'භාෂාව තෝරන්න',
    resetting: language === 'english' ? 'Resetting...' : 'යළි පිහිටුවෙමින්...',
    invalidToken: language === 'english' 
      ? 'Invalid or expired reset link. Please request a new password reset.'
      : 'වලංගු නොවන හෝ කල් ඉකුත් වූ යළි පිහිටුවීමේ සබැඳිය. කරුණාකර නව මුරපද යළි පිහිටුවීමක් ඉල්ලන්න.',
    passwordRequirements: language === 'english' ? 'Password Requirements:' : 'මුරපද අවශ්‍යතා:',
    min8Chars: language === 'english' ? 'At least 8 characters' : 'අවම වශයෙන් අක්ෂර 8 ක්',
    oneUppercase: language === 'english' ? 'One uppercase letter' : 'එක් ඉහළ අක්ෂරයක්',
    oneLowercase: language === 'english' ? 'One lowercase letter' : 'එක් පහළ අක්ෂරයක්',
    oneNumber: language === 'english' ? 'One number' : 'එක් අංකයක්',
    oneSpecialChar: language === 'english' ? 'One special character' : 'එක් විශේෂ අක්ෂරයක්'
  };

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
    }
  }, [token]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setError('');
    setSuccess('');
  };

  const validatePassword = (password) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
    return Object.values(passwordStrength).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.password || !formData.confirmPassword) {
      setError(language === 'english' 
        ? 'Please fill in all fields'
        : 'කරුණාකර සියලුම ක්ෂේත්‍ර පුරවන්න');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'english'
        ? 'Passwords do not match'
        : 'මුරපද සමාන නොවේ');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(language === 'english'
        ? 'Password does not meet requirements'
        : 'මුරපදය අවශ්‍යතා සපුරා නොමැත');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/schools/reset-password', {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setSuccess(language === 'english'
        ? 'Password has been reset successfully'
        : 'මුරපදය සාර්ථකව යළි පිහිටුවන ලදී');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/school-login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'english'
        ? 'Failed to reset password. Please try again.'
        : 'මුරපදය යළි පිහිටුවීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTokenValid) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form-wrapper">
          <div className="error-message">{translations.invalidToken}</div>
          <div className="back-to-login">
            <button
              className="back-to-login-button"
              onClick={() => navigate('/school-login')}
            >
              {translations.backToLogin}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-wrapper">
        <div className="language-selector-container">
          <div className="language-selector">
            <MdLanguage className="language-icon" />
            <select
              className="language-select"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="english">English</option>
              <option value="sinhala">සිංහල</option>
            </select>
          </div>
        </div>

        <h1 className="reset-password-title">{translations.title}</h1>
        <p className="reset-password-subtitle">{translations.subtitle}</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <MdLock className="form-icon" />
              {translations.passwordLabel}
              <span className="required-mark">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${error ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder={translations.passwordLabel}
            />
            {formData.password && (
              <div className="password-requirements">
                <p>{translations.passwordRequirements}</p>
                <ul>
                  <li className={passwordStrength.hasMinLength ? 'valid' : ''}>
                    <span className="check-icon">{passwordStrength.hasMinLength ? '✓' : '•'}</span>
                    {translations.min8Chars}
                  </li>
                  <li className={passwordStrength.hasUpperCase ? 'valid' : ''}>
                    <span className="check-icon">{passwordStrength.hasUpperCase ? '✓' : '•'}</span>
                    {translations.oneUppercase}
                  </li>
                  <li className={passwordStrength.hasLowerCase ? 'valid' : ''}>
                    <span className="check-icon">{passwordStrength.hasLowerCase ? '✓' : '•'}</span>
                    {translations.oneLowercase}
                  </li>
                  <li className={passwordStrength.hasNumber ? 'valid' : ''}>
                    <span className="check-icon">{passwordStrength.hasNumber ? '✓' : '•'}</span>
                    {translations.oneNumber}
                  </li>
                  <li className={passwordStrength.hasSpecialChar ? 'valid' : ''}>
                    <span className="check-icon">{passwordStrength.hasSpecialChar ? '✓' : '•'}</span>
                    {translations.oneSpecialChar}
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              <MdLock className="form-icon" />
              {translations.confirmPasswordLabel}
              <span className="required-mark">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-input ${error ? 'input-error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={translations.confirmPasswordLabel}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? translations.resetting : translations.submitButton}
          </button>
        </form>

        <div className="back-to-login">
          <button
            className="back-to-login-button"
            onClick={() => navigate('/school-login')}
          >
            {translations.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 