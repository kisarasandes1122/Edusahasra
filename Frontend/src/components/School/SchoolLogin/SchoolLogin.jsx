import React, { useState, useEffect } from 'react';
import { MdEmail, MdLock, MdLanguage } from 'react-icons/md';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import './SchoolLogin.css';

const SchoolLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const [errors, setErrors] = useState({
        email: '',
        password: '',
        submit: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [language, setLanguage] = useState('english');

    const navigate = useNavigate();


    useEffect(() => {
       const schoolInfo = localStorage.getItem('schoolInfo');
       if (schoolInfo) {
         navigate('/Dashboard');
       }
     }, [navigate]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
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

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        setErrors({ email: '', password: '', submit: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors((prevErrors) => ({ ...prevErrors, submit: '' }));

        const newErrors = {};
        if (!formData.email) {
            newErrors.email = language === 'english' ? 'Email address is required' : 'විද්‍යුත් තැපෑල ලිපිනය අවශ්‍යයි';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = language === 'english' ? 'Please enter a valid email address' : 'වලංගු විද්‍යුත් තැපෑල ලිපිනයක් ඇතුළත් කරන්න';
        }

        if (!formData.password) {
            newErrors.password = language === 'english' ? 'Password is required' : 'මුරපදය අවශ්‍යයි';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                schoolEmail: formData.email,
                password: formData.password,
            };
            console.log('Sending login payload:', payload);

            const response = await api.post('/api/schools/login', payload);

            console.log('Login response:', response);

            if (response.data && response.data.token) {
                console.log('Login Successful:', response.data);
                localStorage.setItem('schoolInfo', JSON.stringify(response.data));
                navigate('/Dashboard');
            } else {
                 console.error('Login response missing token:', response.data);
                 setErrors((prevErrors) => ({
                    ...prevErrors,
                    submit: language === 'english' ? 'Login failed: Invalid server response.' : 'පිවිසීම අසාර්ථකයි: සේවාදායක දෝෂයක්.'
                 }));
            }

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = language === 'english' ? 'An unexpected error occurred. Please try again.' : 'අනපේක්ෂිත දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.';

            if (error.response) {
                console.error('Backend error data:', error.response.data);
                errorMessage = error.response.data?.message || `Login failed (Status: ${error.response.status})`;

                if (error.response.data?.message === 'Invalid credentials') {
                    errorMessage = language === 'english' ? 'Invalid email or password.' : 'වැරදි විද්‍යුත් තැපෑල හෝ මුරපදය.';
                } else if (error.response.data?.message === 'Your school registration is pending approval or has been rejected.') {
                    errorMessage = language === 'english' ? 'Account not approved or rejected. Please wait for verification or contact support.' : 'ගිණුම අනුමත කර නොමැත හෝ ප්‍රතික්ෂේප කර ඇත. කරුණාකර සත්‍යාපනය සඳහා රැඳී සිටින්න.';
                }
            } else if (error.request) {
                errorMessage = language === 'english' ? 'Network error. Unable to connect to server.' : 'ජාල දෝෂයකි. සේවාදායකයට සම්බන්ධ විය නොහැක.';
            }

            setErrors((prevErrors) => ({
                ...prevErrors,
                submit: errorMessage,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const translations = {
        title: language === 'english' ? 'School Portal Login' : 'පාසල් ද්වාරයට පිවිසීම',
        subtitle: language === 'english'
            ? 'Login only available for approved school accounts.'
            : 'පිවිසිය හැක්කේ අනුමත පාසල් ගිණුම් සඳහා පමණි.',
        emailLabel: language === 'english' ? 'School Email Address' : 'පාසල් විද්‍යුත් තැපෑල ලිපිනය',
        passwordLabel: language === 'english' ? 'Password' : 'මුරපදය',
        rememberMe: language === 'english' ? 'Remember Me' : 'මතක තබා ගන්න',
        forgotPassword: language === 'english' ? 'Forgot Password?' : 'මුරපදය අමතක වුණාද?',
        signIn: language === 'english' ? 'Sign in' : 'පිවිසෙන්න',
        noAccount: language === 'english' ? 'Don\'t have an Account?' : 'ගිණුමක් නොමැතිද?',
        signUp: language === 'english' ? 'Register Here' : 'මෙහි ලියාපදිංචි වන්න',
        emailPlaceholder: language === 'english' ? 'Enter your school email' : 'ඔබගේ පාසල් විද්‍යුත් තැපෑල ඇතුළත් කරන්න',
        passwordPlaceholder: language === 'english' ? 'Enter your password' : 'ඔබගේ මුරපදය ඇතුළත් කරන්න',
        selectLanguage: language === 'english' ? 'Select Language' : 'භාෂාව තෝරන්න',
        signingIn: language === 'english' ? 'Signing in...' : 'පිවිසෙමින්...'
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

                <form className="login-form" onSubmit={handleSubmit} noValidate>

                    {errors.submit && (
                        <p className="error-message submit-error-message">{errors.submit}</p>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            <MdEmail className="form-icon" />
                            {translations.emailLabel}
                            <span className="required-mark">*</span>
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            className={`form-input ${errors.email ? 'input-error' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={translations.emailPlaceholder}
                            aria-required="true"
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>

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
                            className={`form-input ${errors.password ? 'input-error' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={translations.passwordPlaceholder}
                            aria-required="true"
                            aria-invalid={!!errors.password}
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
                        <Link to="/school-forgot-password" className="forgot-link">{translations.forgotPassword}</Link>
                    </div>

                    <button
                        type="submit"
                        className="signin-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? translations.signingIn : translations.signIn}
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