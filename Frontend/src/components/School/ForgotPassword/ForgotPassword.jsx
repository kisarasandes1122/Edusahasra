import React, { useState } from 'react';
import { MdEmail, MdLanguage } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState('english');
  const navigate = useNavigate();

  const translations = {
    title: language === 'english' ? 'Forgot Password' : 'මුරපදය අමතක වුණාද?',
    subtitle: language === 'english'
      ? 'Enter your school email address and we will send you a link to reset your password.'
      : 'ඔබගේ පාසල් විද්‍යුත් තැපෑල ලිපිනය ඇතුළත් කරන්න. අපි ඔබට මුරපදය යළි පිහිටුවීමට සබැඳියක් යවන්නෙමු.',
    emailLabel: language === 'english' ? 'School Email Address' : 'පාසල් විද්‍යුත් තැපෑල ලිපිනය',
    submitButton: language === 'english' ? 'Send Reset Link' : 'යළි පිහිටුවීමේ සබැඳිය යවන්න',
    backToLogin: language === 'english' ? 'Back to Login' : 'පිවිසීමට ආපසු යන්න',
    selectLanguage: language === 'english' ? 'Select Language' : 'භාෂාව තෝරන්න',
    sending: language === 'english' ? 'Sending...' : 'යැවෙමින්...'
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError(language === 'english' ? 'Please enter your email address' : 'කරුණාකර ඔබගේ විද්‍යුත් තැපෑල ලිපිනය ඇතුළත් කරන්න');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(language === 'english' ? 'Please enter a valid email address' : 'කරුණාකර වලංගු විද්‍යුත් තැපෑල ලිපිනයක් ඇතුළත් කරන්න');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/schools/forgot-password', { schoolEmail: email });
      setSuccess(language === 'english'
        ? 'Password reset link has been sent to your email'
        : 'මුරපදය යළි පිහිටුවීමේ සබැඳිය ඔබගේ විද්‍යුත් තැපෑලට යවන ලදී');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || (language === 'english'
        ? 'Failed to send reset link. Please try again.'
        : 'යළි පිහිටුවීමේ සබැඳිය යැවීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form-wrapper">
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

        <h1 className="forgot-password-title">{translations.title}</h1>
        <p className="forgot-password-subtitle">{translations.subtitle}</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <MdEmail className="form-icon" />
              {translations.emailLabel}
              <span className="required-mark">*</span>
            </label>
            <input
              type="email"
              id="email"
              className={`form-input ${error ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={translations.emailLabel}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? translations.sending : translations.submitButton}
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

export default ForgotPassword;